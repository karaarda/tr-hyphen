import { isConsonant, isVowel, toTurkishLowerCase } from './letters.js';

const TWO_CONSONANT_ONSETS = new Set([
  'kr', 'tr', 'pr', 'br', 'dr', 'gr', 'fr', 'vr', 'pl', 'bl', 'kl', 'gl', 'fl', 'sp', 'st', 'sk',
]);

/** UTF-16 offsets between syllables in the original word. */
export function syllableBoundaries(word: string): number[] {
  const lower = toTurkishLowerCase(word);
  const boundaries: number[] = [];
  let start = 0;
  let hasVowel = false;
  let previousVowel = false;
  let vowel = isVowel(lower[0]);

  for (let i = 0; i < lower.length; i++) {
    const nextVowel = isVowel(lower[i + 1]);
    // After a vowel, split before another vowel or before a consonant followed by a vowel.
    // In a consonant run, normally leave just the last consonant with the next vowel.
    // Preserve the two-consonant onset heuristic for longer runs such as in eks-tra.
    const split = previousVowel
      ? vowel || (nextVowel && isConsonant(lower[i]))
      : hasVowel && (nextVowel || (
        !vowel && i - start >= 2 && !isVowel(lower[i - 2]) &&
        isVowel(lower[i + 2]) && TWO_CONSONANT_ONSETS.has(lower.slice(i, i + 2))
      ));

    if (split) {
      boundaries.push(i);
      start = i;
      hasVowel = false;
    }
    hasVowel ||= vowel;
    previousVowel = vowel;
    vowel = nextVowel;
  }
  return boundaries;
}

/** Splits a word into syllables using Turkish casing and preserves the original spelling. */
export function syllabify(word: string): string[] {
  if (!word.length) return [];
  const syllables: string[] = [];
  let start = 0;
  for (const boundary of syllableBoundaries(word)) {
    syllables.push(word.slice(start, boundary));
    start = boundary;
  }
  syllables.push(word.slice(start));
  return syllables;
}
