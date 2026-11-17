import { hyphenationPoints } from './index.js';

it('finds all breaks in a 32,000-letter token within two seconds', () => {
  const syllables = 16_000;
  const word = 'ba'.repeat(syllables);

  const start = Date.now();
  const points = hyphenationPoints(word);
  const elapsed = Date.now() - start;

  expect(points).toHaveLength(syllables - 1);
  expect(points[0]).toEqual({ index: 2, hyphen: true });
  expect(points[points.length - 1]).toEqual({ index: word.length - 2, hyphen: true });
  expect(elapsed).toBeLessThan(2_000);
});
