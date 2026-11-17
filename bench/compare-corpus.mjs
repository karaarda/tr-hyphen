import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { hyphenateText, SOFT_HYPHEN, ZERO_WIDTH_SPACE } from 'tr-hyphen';

const [modulePath, minimum, ...files] = process.argv.slice(2);
const minWordLength = Number(minimum);
if (!modulePath || !Number.isInteger(minWordLength) || minWordLength < 1 || files.length === 0) {
  throw new Error('Usage: node bench/compare-corpus.mjs <hyphenopoly.module.js> <minWordLength> <file.conllu> [...]');
}

const { default: Hyphenopoly } = await import(pathToFileURL(resolve(modulePath)));
const warnings = new Map();
const reference = Hyphenopoly.config({
  require: ['tr'],
  sync: true,
  minWordLength,
  loaderSync: (file, base) => readFileSync(new URL(file, base)),
  handleEvent: {
    error(event) {
      warnings.set(event.msg, (warnings.get(event.msg) ?? 0) + 1);
      event.preventDefault();
    },
  },
}).get('tr');
if (typeof reference !== 'function') throw new Error('Could not initialize Hyphenopoly for Turkish');

// Align the output to the input so pre-existing invisible characters are not counted as breaks.
function insertedBreaks(input, output) {
  const points = new Map();
  let index = 0;
  for (const char of output) {
    if (input.startsWith(char, index)) {
      index += char.length;
    } else if (char === SOFT_HYPHEN || char === ZERO_WIDTH_SPACE) {
      if (points.has(index)) throw new Error(`Multiple inserted markers at offset ${index}`);
      points.set(index, char);
    } else {
      throw new Error(`Hyphenation changed the input at offset ${index}`);
    }
  }
  if (index !== input.length) throw new Error(`Hyphenation removed text at offset ${index}`);
  return points;
}

function showBreaks(word, start, breaks) {
  let output = '';
  for (let offset = 0; offset <= word.length; offset++) {
    const mark = breaks.get(start + offset);
    if (mark) output += mark === SOFT_HYPHEN ? '·' : '|';
    output += word[offset] ?? '';
  }
  return output;
}

function compare(sentences, filename) {
  const totals = {
    tokens: 0,
    differingTokens: 0,
    shared: 0,
    trHyphenOnly: { softHyphens: 0, zeroWidthSpaces: 0 },
    hyphenopolyOnly: { softHyphens: 0, zeroWidthSpaces: 0 },
  };
  const differences = new Map();

  for (const [number, sentence] of sentences.entries()) {
    let ours;
    let theirs;
    try {
      ours = insertedBreaks(sentence, hyphenateText(sentence));
      theirs = insertedBreaks(sentence, reference(sentence));
    } catch (error) {
      throw new Error(`${filename}, sentence ${number + 1}: ${error.message}`, { cause: error });
    }
    for (const [index, marker] of ours) {
      if (theirs.get(index) === marker) totals.shared++;
      else totals.trHyphenOnly[marker === SOFT_HYPHEN ? 'softHyphens' : 'zeroWidthSpaces']++;
    }
    for (const [index, marker] of theirs) {
      if (ours.get(index) !== marker) {
        totals.hyphenopolyOnly[marker === SOFT_HYPHEN ? 'softHyphens' : 'zeroWidthSpaces']++;
      }
    }

    for (const { 0: word, index } of sentence.matchAll(/[\p{L}\p{M}\p{N}'’-]+/gu)) {
      if (!/\p{L}/u.test(word)) continue;
      totals.tokens++;
      const trHyphen = showBreaks(word, index, ours);
      const hyphenopoly = showBreaks(word, index, theirs);
      if (trHyphen === hyphenopoly) continue;
      totals.differingTokens++;
      const key = JSON.stringify([word, trHyphen, hyphenopoly]);
      if (!differences.has(key)) differences.set(key, { word, trHyphen, hyphenopoly, count: 0 });
      differences.get(key).count++;
    }
  }

  return {
    corpus: basename(filename),
    sentences: sentences.length,
    ...totals,
    differences: [...differences.values()].sort((a, b) => b.count - a.count),
  };
}

const corpora = files.map((path) => {
  const sentences = [...readFileSync(path, 'utf8').matchAll(/^# text = (.*)$/gm)].map((match) => match[1]);
  if (sentences.length === 0) throw new Error(`No CoNLL-U # text lines in ${path}`);
  return compare(sentences, path);
});
console.log(JSON.stringify({ minWordLength, corpora, warnings: Object.fromEntries(warnings) }, null, 2));
