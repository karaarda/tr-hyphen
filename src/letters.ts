/** Turkish letter classes. The class predicates take lowercase letters; see toTurkishLowerCase. */

/**
 * Vowel letters, including the circumflexed â, î, û, which Turkish spelling still uses
 * (kâğıt, hâlâ, millî).
 */
export const VOWELS: readonly string[] = ['e', 'i', 'ö', 'ü', 'a', 'ı', 'o', 'u', 'â', 'î', 'û'];

export const CONSONANTS: readonly string[] = [
  'ç', 'f', 'h', 'k', 'p', 's', 'ş', 't',
  'b', 'c', 'd', 'g', 'ğ', 'j', 'l', 'm', 'n', 'r', 'v', 'y', 'z',
];

export function isVowel(char: string): boolean {
  return VOWELS.includes(char);
}

export function isConsonant(char: string): boolean {
  return CONSONANTS.includes(char);
}

/** True for a letter of the Turkish alphabet, in either case. */
export function isTurkishLetter(char: string): boolean {
  const lower = toTurkishLowerCase(char);
  return isVowel(lower) || isConsonant(lower);
}

/**
 * Lowercases one character with Turkish casing (I → ı, İ → i), always returning a string of
 * the same length so that positions in the lowered word match positions in the original.
 */
export function toTurkishLowerCase(char: string): string {
  if (char === 'I') return 'ı';
  if (char === 'İ') return 'i';
  const lower = char.toLowerCase();
  return lower.length === char.length ? lower : char;
}

/** All vowels in a lowercase word, in order. */
export function getVowels(word: string): string[] {
  return word.split('').filter(isVowel);
}

export function endsWithVowel(word: string): boolean {
  return word.length > 0 && isVowel(word[word.length - 1]);
}
