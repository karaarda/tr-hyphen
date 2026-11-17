import { test } from 'vitest';
import { hyphenateText, hyphenationPoints } from 'tr-hyphen';

const paragraph = 'İstanbul’dan gelen öğretmen, öğrencileriyle okulun bahçesinde karşılaştı. ' +
  'Ankara’da 1996’da başlayan programda Türkçe kitaplar okudular.\n';
const article = paragraph.repeat(100);
const longToken = 'ba'.repeat(16_000);

test('running Turkish text', async ({ bench }) => {
  await bench('100 paragraphs', () => hyphenateText(article)).run();
});

test('long token', async ({ bench }) => {
  await bench('break points in a 32,000-letter token', () => hyphenationPoints(longToken)).run();
});
