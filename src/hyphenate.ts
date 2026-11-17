import { isTurkishWord } from './letters.js';
import { syllableBoundaries } from './syllabify.js';

/*
 * Line-break rules from TDK, "Hece yapısı ve satır sonunda kelimelerin bölünmesi"
 * (tdk.gov.tr/icerik/yazim-kurallari/hece-yapisi-ve-satir-sonunda-kelimelerin-bolunmesi/):
 * - words are divided between syllables, never inside one, with a hyphen at the line end;
 * - "Ayırmada satır sonunda ve satır başında tek harf bırakılmaz" (uçurt-ma, not u-çurtma);
 * - "Kesme işareti satır sonuna geldiğinde yalnız kesme işareti kullanılır; ayrıca çizgi
 *   kullanılmaz" (Ankara’ / dan, 1996’ / da).
 */

export interface HyphenationOptions {
  /**
   * Minimum number of letters (or digits) before a break, counted from the start of the word or
   * from an existing hyphen. Default 2: TDK leaves no single letter at the end of a line.
   */
  minLeft?: number;
  /** Minimum number of letters (or digits) after a break. Default 2: no single letter at the start of a line. */
  minRight?: number;
}

export interface HyphenateOptions extends HyphenationOptions {
  /** Inserted at a hyphenated break. Default '-' for hyphenate, U+00AD (soft hyphen) for hyphenateText. */
  separator?: string;
  /**
   * Inserted at a break right after an apostrophe, where TDK writes no hyphen. Default '' for
   * hyphenate, U+200B (zero-width space) for hyphenateText so that browsers may break there.
   */
  apostropheBreak?: string;
}

export interface HyphenationPoint {
  /** UTF-16 index of the first character after the break. */
  index: number;
  /** True when a hyphen is written at the line end; false for a break right after an apostrophe. */
  hyphen: boolean;
}

export const SOFT_HYPHEN = '­';
export const ZERO_WIDTH_SPACE = '​';

const APOSTROPHES = new Set(["'", '’']);
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const WORD = /[\p{L}\p{M}\p{N}'’-]+/gu;
const WORD_SPAN = /[\p{L}\p{M}\p{N}](?:.*[\p{L}\p{M}\p{N}])?/su;

function countLettersAndDigits(text: string): number {
  let count = 0;
  for (const char of text) {
    if (LETTER_OR_DIGIT.test(char)) count++;
  }
  return count;
}

/**
 * The places in `word` where a line may break. Breaks fall on syllable boundaries (with a hyphen)
 * or right after an apostrophe (without one). Additional package conventions:
 * - leading and trailing punctuation is ignored;
 * - a word that already contains hyphens is divided part by part, never next to its own hyphens
 *   (a line can already break after them);
 * - no syllable contains an apostrophe: the name before it and the suffix after it are divided
 *   on their own (Ah-met’in), and a name that cannot be syllabified, such as a number (1996’da)
 *   or an abbreviation (TBMM’ye), stays whole. Parts with multiple apostrophes stay whole;
 * - a part with anything other than Turkish letters (digits, q, w, x, combining marks) is not
 *   divided, except at an apostrophe.
 */
export function hyphenationPoints(word: string, options: HyphenationOptions = {}): HyphenationPoint[] {
  const minLeft = Math.max(1, options.minLeft ?? 2);
  const minRight = Math.max(1, options.minRight ?? 2);
  if (word.length < minLeft + minRight) return [];

  // Keep combining marks and supplementary letters in the span so validation can see them.
  const span = WORD_SPAN.exec(word);
  if (!span) return [];
  const start = span.index;
  const end = start + span[0].length;

  const points: HyphenationPoint[] = [];
  let partStart = start;
  for (let i = start; i <= end; i++) {
    if (i < end && word[i] !== '-') continue;
    const part = word.slice(partStart, i);
    appendPartPoints(points, part, partStart, minLeft, minRight);
    partStart = i + 1;
  }
  return points;
}

function appendPartPoints(
  points: HyphenationPoint[], part: string, start: number, minLeft: number, minRight: number,
): void {
  if (part.length < minLeft + minRight) return;
  if (isTurkishWord(part)) {
    // Every Turkish letter in this part occupies one UTF-16 code unit.
    for (const index of syllableBoundaries(part)) {
      if (index >= minLeft && part.length - index >= minRight) {
        points.push({ index: start + index, hyphen: true });
      }
    }
    return;
  }

  const candidates = apostrophePoints(part);
  if (candidates.length === 0) return;
  const total = countLettersAndDigits(part);
  let left = 0;
  let cursor = 0;
  for (const point of candidates) {
    left += countLettersAndDigits(part.slice(cursor, point.index));
    if (left >= minLeft && total - left >= minRight) {
      points.push({ index: start + point.index, hyphen: point.hyphen });
    }
    cursor = point.index;
  }
}

function apostrophePoints(part: string): HyphenationPoint[] {
  let apostrophe = -1;
  for (let i = 0; i < part.length; i++) {
    if (APOSTROPHES.has(part[i])) {
      if (apostrophe >= 0) return [];
      apostrophe = i;
    }
  }
  if (apostrophe < 0) return [];

  // No syllable contains the apostrophe: the name and the suffix are syllabified on their own
  // (Ahmet’in is Ah-met’in, never Ah-me-t’in), and the line may always break after it.
  // A name that cannot be syllabified (1996, TBMM, Washington) stays whole.
  const name = part.slice(0, apostrophe);
  const suffix = part.slice(apostrophe + 1);
  const points: HyphenationPoint[] = [];
  if (isTurkishWord(name)) {
    for (const index of syllableBoundaries(name)) points.push({ index, hyphen: true });
  }
  if (name.length > 0 && suffix.length > 0) points.push({ index: apostrophe + 1, hyphen: false });
  if (isTurkishWord(suffix)) {
    for (const index of syllableBoundaries(suffix)) points.push({ index: apostrophe + 1 + index, hyphen: true });
  }
  return points;
}

/**
 * Writes the breaks into the word: `separator` (default '-') at syllable breaks and
 * `apostropheBreak` (default '') after an apostrophe. hyphenate('merhaba') is 'mer-ha-ba'.
 */
export function hyphenate(word: string, options: HyphenateOptions = {}): string {
  const separator = options.separator ?? '-';
  const apostropheBreak = options.apostropheBreak ?? '';
  let result = '';
  let last = 0;
  for (const point of hyphenationPoints(word, options)) {
    result += word.slice(last, point.index) + (point.hyphen ? separator : apostropheBreak);
    last = point.index;
  }
  return result + word.slice(last);
}

/**
 * Hyphenates every word in running text, leaving everything else untouched. Defaults suit HTML
 * with CSS `hyphens: manual`: soft hyphens (U+00AD) at syllable breaks and zero-width spaces
 * (U+200B) after apostrophes.
 */
export function hyphenateText(text: string, options: HyphenateOptions = {}): string {
  const separator = options.separator ?? SOFT_HYPHEN;
  const apostropheBreak = options.apostropheBreak ?? ZERO_WIDTH_SPACE;
  const wordOptions = { ...options, separator, apostropheBreak };
  return text.replace(WORD, (word) => hyphenate(word, wordOptions));
}
