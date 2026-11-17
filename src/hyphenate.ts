import { isTurkishLetter, isVowel, toTurkishLowerCase } from './letters.js';
import { syllabify } from './syllabify.js';

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
  /** Index of the first character after the break. */
  index: number;
  /** True when a hyphen is written at the line end; false for a break right after an apostrophe. */
  hyphen: boolean;
}

export const SOFT_HYPHEN = '­';
export const ZERO_WIDTH_SPACE = '​';

const APOSTROPHES = new Set(["'", '’']);
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const WORD = /[\p{L}\p{M}\p{N}'’-]+/gu;

/**
 * The places in `word` where a line may break. Breaks fall on syllable boundaries (with a hyphen)
 * or right after an apostrophe (without one). Where TDK is silent the rules are conservative, so
 * a returned break is never a wrong one:
 * - leading and trailing punctuation is ignored;
 * - a word that already contains hyphens is divided part by part, never next to its own hyphens
 *   (a line can already break after them);
 * - no syllable contains an apostrophe: the name before it and the suffix after it are divided
 *   on their own (Ah-met’in), and a name that cannot be syllabified, such as a number (1996’da)
 *   or an abbreviation (TBMM’ye), stays whole;
 * - a part with anything other than Turkish letters (digits, q, w, x, combining marks) is not
 *   divided, except at an apostrophe.
 */
export function hyphenationPoints(word: string, options: HyphenationOptions = {}): HyphenationPoint[] {
  const minLeft = Math.max(1, options.minLeft ?? 2);
  const minRight = Math.max(1, options.minRight ?? 2);

  let start = 0;
  let end = word.length;
  while (start < end && !LETTER_OR_DIGIT.test(word[start])) start++;
  while (end > start && !LETTER_OR_DIGIT.test(word[end - 1])) end--;

  const points: HyphenationPoint[] = [];
  let partStart = start;
  for (let i = start; i <= end; i++) {
    if (i === end || word[i] === '-') {
      const count = (from: number, to: number) => Array.from(word.slice(from, to)).filter((c) => LETTER_OR_DIGIT.test(c)).length;
      for (const point of partPoints(word, partStart, i)) {
        if (count(partStart, point.index) >= minLeft && count(point.index, i) >= minRight) points.push(point);
      }
      partStart = i + 1;
    }
  }
  return points;
}

function isTurkishWord(text: string): boolean {
  return text.length > 0 && Array.from(text).every(isTurkishLetter);
}

function hasVowel(text: string): boolean {
  return Array.from(text).some((c) => isVowel(toTurkishLowerCase(c)));
}

/** Offsets of the syllable boundaries inside `text`. */
function boundaries(text: string): number[] {
  const result: number[] = [];
  let offset = 0;
  const syllables = syllabify(text);
  for (let i = 0; i < syllables.length - 1; i++) {
    offset += syllables[i].length;
    result.push(offset);
  }
  return result;
}

/** Every candidate break in word[start, end), before the minimum-length filter. */
function partPoints(word: string, start: number, end: number): HyphenationPoint[] {
  let apostrophe = -1;
  for (let i = start; i < end; i++) {
    if (APOSTROPHES.has(word[i])) {
      apostrophe = i;
      break;
    }
  }

  if (apostrophe < 0) {
    const text = word.slice(start, end);
    if (!isTurkishWord(text)) return [];
    return boundaries(text).map((b) => ({ index: start + b, hyphen: true }));
  }

  // No syllable contains the apostrophe: the name and the suffix are syllabified on their own
  // (Ahmet’in is Ah-met’in, never Ah-me-t’in), and the line may always break after it.
  // A name that cannot be syllabified (1996, TBMM, Washington) stays whole.
  const name = word.slice(start, apostrophe);
  const suffix = word.slice(apostrophe + 1, end);
  const points: HyphenationPoint[] = [];
  if (isTurkishWord(name) && hasVowel(name)) {
    for (const b of boundaries(name)) points.push({ index: start + b, hyphen: true });
  }
  if (name.length > 0 && suffix.length > 0) points.push({ index: apostrophe + 1, hyphen: false });
  if (isTurkishWord(suffix)) {
    for (const b of boundaries(suffix)) points.push({ index: apostrophe + 1 + b, hyphen: true });
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
  return text.replace(WORD, (word) => hyphenate(word, { ...options, separator, apostropheBreak }));
}
