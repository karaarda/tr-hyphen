import { endsWithVowel, getVowels, isConsonant, isVowel, toTurkishLowerCase } from "./letters.js";

/*
 1. Türkçede kelime içinde iki ünlü arasındaki ünsüz, kendinden sonraki ünlüyle hece kurar
 2. Kelime içinde yan yana gelen iki ünsüzden ilki kendinden önceki ünlüyle, ikincisi kendinden sonraki ünlüyle hece kurar
 3. Kelime içinde yan yana gelen üç ünsüz harften ilk ikisi kendinden önceki ünlüyle, üçüncüsü kendinden sonraki ünlüyle hece kurar
 4. Hece tek ünsüzden oluşamaz
 */

/**
 * Splits a word into syllables. Letters are classified case-insensitively (with Turkish casing),
 * and the syllables keep the original spelling: syllabify('IRMAK') is ['IR', 'MAK'].
 */
export function syllabify(word: string): string[] {
  const lower = Array.from(word, toTurkishLowerCase).join('');
  const syllables: string[] = [];
  let start = 0;
  for (const syllable of syllabifyLower(lower)) {
    syllables.push(word.slice(start, start + syllable.length));
    start += syllable.length;
  }
  return syllables;
}

function syllabifyLower(word: string): string[] {
  const syllables: string[] = []
  let currentSyllable = ""

  for (let i = 0; i < word.length; ++i) {
    if (endsWithVowel(currentSyllable)) { // rule 1
      if ((isConsonant(word[i]) && isVowel(word[i + 1])) || isVowel(word[i])) {
        syllables.push(currentSyllable);
        currentSyllable = word[i];
      } else {
        currentSyllable += word[i];
      }
    } else if (isVowel(word[i + 1]) && getVowels(currentSyllable).length > 0) { // rule 2 && rule 4
      syllables.push(currentSyllable);
      currentSyllable = word[i];
    } else if (
      word[i + 2] &&
      !isVowel(word[i]) &&
      !isVowel(word[i + 1]) &&
      isVowel(word[i + 2]) &&
      getVowels(currentSyllable).length > 0 &&
      currentSyllable.length >= 2 &&
      !isVowel(currentSyllable[currentSyllable.length - 1]) &&
      !isVowel(currentSyllable[currentSyllable.length - 2])
    ) {
      const nextCluster = (word[i] + word[i + 1]).toLowerCase();
      const validOnsets = ['kr', 'tr', 'pr', 'br', 'dr', 'gr', 'fr', 'vr', 'pl', 'bl', 'kl', 'gl', 'fl', 'sp', 'st', 'sk'];
      if (validOnsets.includes(nextCluster)) {
        syllables.push(currentSyllable);
        currentSyllable = word[i];
      } else {
        currentSyllable += word[i];
      }
    } else { // rule 3
      currentSyllable += word[i];
    }
  }

  if (currentSyllable) {
    syllables.push(currentSyllable);
  }

  return syllables.filter(Boolean)
}