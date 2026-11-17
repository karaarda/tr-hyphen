/** Turkish letter classes. The vowel and consonant predicates take lowercase letters. */

/**
 * Vowel letters, including the circumflexed â, î, û, which Turkish spelling still uses
 * (kâğıt, hâlâ, millî).
 */
const VOWELS: readonly string[] = ['e', 'i', 'ö', 'ü', 'a', 'ı', 'o', 'u', 'â', 'î', 'û'];

const CONSONANTS: readonly string[] = [
  'ç', 'f', 'h', 'k', 'p', 's', 'ş', 't',
  'b', 'c', 'd', 'g', 'ğ', 'j', 'l', 'm', 'n', 'r', 'v', 'y', 'z',
];

const LETTERS = VOWELS.join('') + CONSONANTS.join('');
// Include dotted capital İ and the Unicode canonical equivalent of capital K (K).
const NON_TURKISH_LETTER = new RegExp(`[^${LETTERS}${LETTERS.toUpperCase()}İK]`, 'u');

export function isVowel(char: string): boolean {
  return VOWELS.includes(char);
}

export function isConsonant(char: string): boolean {
  return CONSONANTS.includes(char);
}

/** True for a nonempty word containing only Turkish letters, in either case. */
export function isTurkishWord(word: string): boolean {
  return word.length > 0 && !NON_TURKISH_LETTER.test(word);
}

/**
 * Map I and İ before lowercasing. The default mapping of İ introduces a combining dot, which
 * would shift the break offsets in the lowered word.
 */
export function toTurkishLowerCase(word: string): string {
  return word.replace(/[Iİ]/g, (char) => char === 'I' ? 'ı' : 'i').toLowerCase();
}
