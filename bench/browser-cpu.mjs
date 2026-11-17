import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [executable, ...corpora] = process.argv.slice(2);
if (!executable || !corpora.length) {
  throw new Error('Usage: node bench/browser-cpu.mjs <chrome-executable> <file.conllu> [...]');
}
const sentences = corpora.flatMap((path) =>
  Array.from(readFileSync(path, 'utf8').matchAll(/^# text = (.*)$/gm), ([, text]) => text));
if (!sentences.length) throw new Error('No CoNLL-U # text lines found');

const builds = { current: new URL('../dist/index.js', import.meta.url).href };
if (process.env.BASELINE_DIR) {
  builds.baseline = pathToFileURL(resolve(process.env.BASELINE_DIR, 'index.js')).href;
}

const directory = mkdtempSync(join(tmpdir(), 'tr-hyphen-browser-'));
const page = join(directory, 'bench.html');
writeFileSync(page, '<!doctype html><meta charset="utf-8"><title>Hyphenation benchmark</title>');
const chrome = spawn(executable, [
  '--headless', '--remote-debugging-pipe', '--no-first-run', '--disable-background-networking',
  '--allow-file-access-from-files', `--user-data-dir=${join(directory, 'profile')}`,
], { stdio: ['ignore', 'ignore', 'inherit', 'pipe', 'pipe'] });

const pending = new Map();
const closed = new Promise((resolve) => chrome.once('close', resolve));
function failPending(error) {
  for (const request of pending.values()) request.reject(error);
}
chrome.on('error', failPending);
chrome.stdio[3].on('error', failPending);
chrome.once('exit', (code, signal) => failPending(new Error(`Chrome exited (${signal ?? code})`)));
let id = 0;
let buffer = '';
chrome.stdio[4].setEncoding('utf8').on('data', (chunk) => {
  const messages = (buffer + chunk).split('\0');
  buffer = messages.pop();
  for (const message of messages) {
    if (!message) continue;
    const { id, result, error } = JSON.parse(message);
    const request = pending.get(id);
    if (!request) continue;
    if (error) request.reject(new Error(error.message));
    else request.resolve(result);
  }
});

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const requestId = ++id;
    const timeout = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Chrome did not respond to ${method}`));
    }, 30_000);
    function finish(callback) {
      return (value) => {
        clearTimeout(timeout);
        pending.delete(requestId);
        callback(value);
      };
    }
    pending.set(requestId, { resolve: finish(resolve), reject: finish(reject) });
    chrome.stdio[3].write(JSON.stringify({ id: requestId, method, params, sessionId }) + '\0');
  });
}

function measure(builds, texts) {
  return Promise.all(Object.entries(builds).map(async ([name, url]) => [name, (await import(url)).hyphenateText]))
    .then((engines) => texts.map((text) => {
      const reference = engines[0][1](text);
      for (const [, format] of engines) {
        if (format(text) !== reference) throw new Error('Builds produced different hyphenation');
        for (let i = 0; i < 3; i++) format(text);
      }

      const samples = Object.fromEntries(engines.map(([name]) => [name, []]));
      let outputLength = 0;
      for (let i = 0; i < 9; i++) {
        for (const [name, format] of i % 2 ? [...engines].reverse() : engines) {
          const start = performance.now();
          outputLength = format(text).length;
          samples[name].push(performance.now() - start);
        }
      }
      const medianMs = Object.fromEntries(Object.entries(samples).map(([name, values]) =>
        [name, values.sort((a, b) => a - b)[4]]));
      return { characters: text.length, outputLength, medianMs };
    }));
}

try {
  const { product } = await send('Browser.getVersion');
  const { targetId } = await send('Target.createTarget', { url: pathToFileURL(page).href });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const texts = [sentences.slice(0, 450).join('\n'), sentences.join('\n')];
  const expression = `(${measure})(${JSON.stringify(builds)}, ${JSON.stringify(texts)})`;
  for (const rate of [1, 6]) {
    await send('Emulation.setCPUThrottlingRate', { rate }, sessionId);
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    }, sessionId);
    if (exceptionDetails) throw new Error(result.description ?? exceptionDetails.text);
    console.log(JSON.stringify({ browser: product, throttle: rate, workloads: result.value }));
  }
} finally {
  if (chrome.pid && chrome.exitCode === null && chrome.signalCode === null) chrome.kill();
  await closed;
  rmSync(directory, { recursive: true, force: true });
}
