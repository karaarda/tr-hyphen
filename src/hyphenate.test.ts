import { SOFT_HYPHEN, ZERO_WIDTH_SPACE, hyphenate, hyphenateText, hyphenationPoints, syllabify } from './index.js';

// Examples from TDK, "Hece yapısı ve satır sonunda kelimelerin bölünmesi".
describe('TDK syllable structure', () => {
  it.each([
    // one consonant between vowels goes with the next vowel
    ['araba', 'a-ra-ba'], ['biçimine', 'bi-çi-mi-ne'], ['insanın', 'in-sa-nın'], ['karaca', 'ka-ra-ca'],
    // two consonants: the first closes the syllable, the second opens the next
    ['aldı', 'al-dı'], ['birlik', 'bir-lik'], ['sevmek', 'sev-mek'],
    // three consonants: the first two close the syllable, the third opens the next
    ['altlık', 'alt-lık'], ['Türkçe', 'Türk-çe'], ['korkmak', 'kork-mak'],
    // loanwords follow Turkish syllable structure
    ['bandrol', 'band-rol'], ['kontrol', 'kont-rol'], ['portre', 'port-re'], ['program', 'prog-ram'],
    ['santral', 'sant-ral'], ['sürpriz', 'sürp-riz'], ['tundra', 'tund-ra'], ['volfram', 'volf-ram'],
    // later syllables start with a consonant, in compounds written as one word too
    ['başöğretmen', 'ba-şöğ-ret-men'], ['ilkokul', 'il-ko-kul'], ['Karaosmanoğlu', 'Ka-ra-os-ma-noğ-lu'],
  ])('%s → %s', (word, expected) => {
    expect(syllabify(word).join('-')).toBe(expected);
  });
});

describe('TDK line breaks', () => {
  it.each([
    ['eşyalara', 2], ['ruhuna', 4], ['geçtiği', 5],
  ])('allows the line break shown in the TDK passage for %s', (word, index) => {
    expect(hyphenationPoints(word)).toContainEqual({ index, hyphen: true });
  });

  it.each([
    ['uçurtma', 'u-çurt-ma', [5]],
    ['müdafaa', 'mü-da-fa-a', [2, 4]],
  ])('filters single-letter line breaks in %s', (word, syllables, indices) => {
    expect(syllabify(word).join('-')).toBe(syllables);
    expect(hyphenationPoints(word)).toEqual(indices.map((index) => ({ index, hyphen: true })));
  });

  it('breaks after an apostrophe without a hyphen', () => {
    expect(hyphenationPoints('Edirne’nin')).toEqual([
      { index: 4, hyphen: true },
      { index: 7, hyphen: false },
    ]);
    expect(hyphenationPoints('Ankara’dan')).toEqual([
      { index: 2, hyphen: true },
      { index: 4, hyphen: true },
      { index: 7, hyphen: false },
    ]);
    expect(hyphenationPoints('1996’da')).toEqual([{ index: 5, hyphen: false }]);
  });
});

describe('syllabify on real spelling', () => {
  it('treats the circumflexed vowels â, î, û as vowels', () => {
    expect(syllabify('kâğıt')).toEqual(['kâ', 'ğıt']);
    expect(syllabify('hâlâ')).toEqual(['hâ', 'lâ']);
    expect(syllabify('millî')).toEqual(['mil', 'lî']);
    expect(syllabify('mahkûm')).toEqual(['mah', 'kûm']);
  });

  it('classifies capitals with Turkish casing and keeps the original spelling', () => {
    expect(syllabify('Ankara')).toEqual(['An', 'ka', 'ra']);
    expect(syllabify('IRMAK')).toEqual(['IR', 'MAK']);
    expect(syllabify('İstanbul')).toEqual(['İs', 'tan', 'bul']);
    expect(syllabify('ÖĞRETMEN')).toEqual(['ÖĞ', 'RET', 'MEN']);
  });
});

describe('hyphenate', () => {
  it('breaks at syllable boundaries', () => {
    expect(hyphenate('merhaba')).toBe('mer-ha-ba');
    expect(hyphenate('gidilemeyeceğine')).toBe('gi-di-le-me-ye-ce-ği-ne');
    expect(hyphenate('parka')).toBe('par-ka');
  });

  it('leaves short and one-syllable words alone', () => {
    expect(hyphenate('park')).toBe('park');
    expect(hyphenate('okul')).toBe('okul');
    expect(hyphenate('a')).toBe('a');
    expect(hyphenate('')).toBe('');
  });

  it('honours minLeft and minRight', () => {
    expect(hyphenate('atamadım', { minLeft: 1, minRight: 1 })).toBe('a-ta-ma-dım');
    expect(hyphenate('aile', { minLeft: 1 })).toBe('a-i-le');
    expect(hyphenate('aile', { minLeft: 1, minRight: 3 })).toBe('a-ile');
    expect(hyphenate('merhaba', { minRight: 3 })).toBe('mer-haba');
  });

  it('uses a custom separator and apostrophe break', () => {
    expect(hyphenate('merhaba', { separator: '·' })).toBe('mer·ha·ba');
    expect(hyphenate('Ankara’dan', { apostropheBreak: '|' })).toBe('An-ka-ra’|dan');
  });

  it('keeps leading and trailing punctuation out of the syllables', () => {
    expect(hyphenate('merhaba,')).toBe('mer-ha-ba,');
    expect(hyphenate('"evler"')).toBe('"ev-ler"');
    expect(hyphenate('(kitaplar)')).toBe('(ki-tap-lar)');
  });

  it('syllabifies across an apostrophe', () => {
    expect(hyphenate("Ankara'da", { apostropheBreak: '|' })).toBe("An-ka-ra'|da");
    expect(hyphenate("İstanbul'dakiler", { apostropheBreak: '|' })).toBe("İs-tan-bul'|da-ki-ler");
    // No syllable contains the apostrophe: Ah-met’in, never Ah-me-t’in.
    expect(hyphenationPoints('Ahmet’in')).toEqual([
      { index: 2, hyphen: true },
      { index: 6, hyphen: false },
    ]);
    expect(hyphenate('Ahmet’in', { apostropheBreak: '|' })).toBe('Ah-met’|in');
    expect(hyphenate('Mehmet’ten', { apostropheBreak: '|' })).toBe('Meh-met’|ten');
    expect(hyphenate('Ahmet’inki', { apostropheBreak: '|' })).toBe('Ah-met’|in-ki');
    expect(hyphenate('Tarık’ın', { apostropheBreak: '|' })).toBe('Ta-rık’|ın');
    expect(hyphenate('Ahmet’e', { apostropheBreak: '|' })).toBe('Ah-met’e');
    // A single letter after the apostrophe stays on the line.
    expect(hyphenationPoints('Ankara’ya')).toContainEqual({ index: 7, hyphen: false });
    expect(hyphenationPoints('Edirne’e')).toEqual([{ index: 4, hyphen: true }]);
  });

  it('keeps numbers and abbreviations whole, breaking only after their apostrophe', () => {
    expect(hyphenate("2023'te", { apostropheBreak: '|' })).toBe("2023'|te");
    expect(hyphenate("TBMM'ye", { apostropheBreak: '|' })).toBe("TBMM'|ye");
    expect(hyphenate("1996'daki", { apostropheBreak: '|' })).toBe("1996'|da-ki");
    expect(hyphenate('3.')).toBe('3.');
  });

  it('divides each part of a hyphenated compound, never next to its hyphen', () => {
    expect(hyphenate('alt-üst')).toBe('alt-üst');
    expect(hyphenate('anne-baba')).toBe('an-ne-ba-ba');
    expect(hyphenate('ana-baba', { minLeft: 3 })).toBe('ana-baba');
  });

  it('does not divide words with letters outside the Turkish alphabet', () => {
    expect(hyphenate('Washington')).toBe('Washington');
    expect(hyphenate('examen')).toBe('examen');
    expect(hyphenate('Washington’dan', { apostropheBreak: '|' })).toBe('Washington’|dan');
  });

  it.each(['𐐀merhaba', 'merhaba𐐀', 'abca\u0301', 'başöğretmen'])(
    'keeps an unsupported word intact inside punctuation (%s)', (word) => {
      expect(hyphenationPoints(`(${word})`)).toEqual([]);
      expect(hyphenateText(`(${word})`)).toBe(`(${word})`);
    },
  );

  it('counts supplementary letters once while returning UTF-16 indices', () => {
    expect(hyphenationPoints('«𐐀𐐀’de»')).toEqual([{ index: 6, hyphen: false }]);
    expect(hyphenationPoints('«𐐀’de»')).toEqual([]);
    expect(hyphenationPoints('🙂merhaba!')).toEqual([
      { index: 5, hyphen: true }, { index: 7, hyphen: true },
    ]);
  });

  it('leaves parts with multiple apostrophes intact', () => {
    expect(hyphenateText("I'm Ankara’dan’geldim")).toBe("I'm Ankara’dan’geldim");
  });
});

describe('hyphenateText', () => {
  it('inserts soft hyphens and zero-width spaces and leaves the rest untouched', () => {
    const s = SOFT_HYPHEN;
    const z = ZERO_WIDTH_SPACE;
    expect(hyphenateText('Merhaba, Ankara’dan geldim.')).toBe(`Mer${s}ha${s}ba, An${s}ka${s}ra’${z}dan gel${s}dim.`);
  });

  it('accepts visible separators and the other options', () => {
    expect(hyphenateText('Öğretmen 2023 yılında okula geldi.', { separator: '-' }))
      .toBe('Öğ-ret-men 2023 yı-lın-da oku-la gel-di.');
  });
});
