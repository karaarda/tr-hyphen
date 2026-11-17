/**
 * Tests for Turkish syllabification system
 */

import { syllabify } from './syllabify.js';

describe('Syllabification', () => {
  describe('Syllable types', () => {
    it('should handle V', () => {
      expect(syllabify('a')).toEqual(['a']);
      expect(syllabify('e')).toEqual(['e']);
    });

    it('should handle VC', () => {
      expect(syllabify('ta')).toEqual(['ta']);
      expect(syllabify('gü')).toEqual(['gü']);
      expect(syllabify('ke')).toEqual(['ke']);
    });

    it('should handle CV', () => {
      expect(syllabify('at')).toEqual(['at']);
      expect(syllabify('el')).toEqual(['el']);
      expect(syllabify('git')).toEqual(['git']);
    });

    it('should handle CVC patterns', () => {
      expect(syllabify('kol')).toEqual(['kol']);
      expect(syllabify('kap')).toEqual(['kap']);
      expect(syllabify('gül')).toEqual(['gül']);
    });

    it('should handle VCC patterns', () => {
      expect(syllabify('alt')).toEqual(['alt']);
      expect(syllabify('üst')).toEqual(['üst']);
      expect(syllabify('ört')).toEqual(['ört']);
    });

    it('should handle CVCC patterns', () => {
      expect(syllabify('kült')).toEqual(['kült']);
      expect(syllabify('kart')).toEqual(['kart']);
      expect(syllabify('sert')).toEqual(['sert']);
    });

    it('should handle VCV patterns', () => {
      expect(syllabify('ada')).toEqual(['a', 'da']);
      expect(syllabify('ene')).toEqual(['e', 'ne']);
      expect(syllabify('oku')).toEqual(['o', 'ku']);
    });

    it('should handle CCV patterns', () => {
      expect(syllabify('brifing')).toEqual(['bri', 'fing']);
      expect(syllabify('kravat')).toEqual(['kra', 'vat']);
      expect(syllabify('kroki')).toEqual(['kro', 'ki']);
      expect(syllabify('kriko')).toEqual(['kri', 'ko']);
      expect(syllabify('plasenta')).toEqual(['pla', 'sen', 'ta']);
      expect(syllabify('prasa')).toEqual(['pra', 'sa']);
      expect(syllabify('prehistorya')).toEqual(['pre', 'his', 'tor', 'ya']);
      expect(syllabify('proje')).toEqual(['pro', 'je']);
      expect(syllabify('psikoloji')).toEqual(['psi', 'ko', 'lo', 'ji']);
      expect(syllabify('skolastik')).toEqual(['sko', 'las', 'tik']);
      expect(syllabify('slovak')).toEqual(['slo', 'vak']);
      expect(syllabify('spiker')).toEqual(['spi', 'ker']);
      expect(syllabify('stopaj')).toEqual(['sto', 'paj']);
      expect(syllabify('trafik')).toEqual(['tra', 'fik']);
      expect(syllabify('trajik')).toEqual(['tra', 'jik']);
    });

    it('should handle CCVC patterns', () => {
      expect(syllabify('bronşit')).toEqual(['bron', 'şit']);
      expect(syllabify('brüksel')).toEqual(['brük', 'sel']);
      expect(syllabify('fransa')).toEqual(['fran', 'sa']);
      expect(syllabify('fren')).toEqual(['fren']);
      expect(syllabify('frunze')).toEqual(['frun', 'ze']);
      expect(syllabify('gram')).toEqual(['gram',]);
      expect(syllabify('kral')).toEqual(['kral']);
      expect(syllabify('kristal')).toEqual(['kris', 'tal']);
      expect(syllabify('plasman')).toEqual(['plas', 'man']);
      expect(syllabify('pragmatik')).toEqual(['prag', 'ma', 'tik']);
      expect(syllabify('prenses')).toEqual(['pren', 'ses']);
      expect(syllabify('prestij')).toEqual(['pres', 'tij']);
      expect(syllabify('problem')).toEqual(['prob', 'lem']);
      expect(syllabify('slav')).toEqual(['slav',]);
      expect(syllabify('slov')).toEqual(['slov']);
      expect(syllabify('spor')).toEqual(['spor']);
      expect(syllabify('star')).toEqual(['star']);
      expect(syllabify('trap')).toEqual(['trap']);
      expect(syllabify('tren')).toEqual(['tren']);
    });

    it('should handle CCVCC patterns', () => {
      expect(syllabify('branş')).toEqual(['branş']);
      expect(syllabify('bronz')).toEqual(['bronz']);
      expect(syllabify('frank')).toEqual(['frank']);
      expect(syllabify('frankfurt')).toEqual(['frank', 'furt']);
      expect(syllabify('kramp')).toEqual(['kramp']);
      expect(syllabify('prens')).toEqual(['prens']);
      expect(syllabify('stand')).toEqual(['stand']);
      expect(syllabify('start')).toEqual(['start']);
      expect(syllabify('transkripsiyon')).toEqual(['trans', 'krip', 'si', 'yon']);
      expect(syllabify('trink')).toEqual(['trink']);
      expect(syllabify('tröst')).toEqual(['tröst']);
    });

    it('should handle CCVCCC patterns', () => {
      expect(syllabify('sfenksleşmek')).toEqual(['sfenks', 'leş', 'mek']);
    });

    it('should handle CCCV patterns', () => {
      expect(syllabify('stratejik')).toEqual(['stra', 'te', 'jik']);
      expect(syllabify('stratosfer')).toEqual(['stra', 'tos', 'fer']);
      expect(syllabify('strese')).toEqual(['stre', 'se']);
    });

    it('should handle CCCVC patterns', () => {
      expect(syllabify('sprey')).toEqual(['sprey']);
      expect(syllabify('streç')).toEqual(['streç']);
      expect(syllabify('striptiz')).toEqual(['strip', 'tiz']);
      expect(syllabify('strüktürel')).toEqual(['strük', 'tü', 'rel']);
    });

    it('should handle CCCVCC patterns', () => {
      expect(syllabify('spring')).toEqual(['spring']);
      expect(syllabify('sprint')).toEqual(['sprint']);
      expect(syllabify('skriks')).toEqual(['skriks']);
    });
  });

  describe('Base rules', () => {
    it('should group a consonant with following vowel when it is between two vowels', () => {
      expect(syllabify('araba')).toEqual(['a', 'ra', 'ba']);
      expect(syllabify('biçimine')).toEqual(['bi', 'çi', 'mi', 'ne']);
      expect(syllabify('insanın')).toEqual(['in', 'sa', 'nın']);
      expect(syllabify('karaca')).toEqual(['ka', 'ra', 'ca']);
    })

    it('should group a consonant with previous vowel if following consonant is followed by a vowel', () => {
      expect(syllabify('aldı')).toEqual(['al', 'dı']);
      expect(syllabify('birlik')).toEqual(['bir', 'lik']);
      expect(syllabify('sevmek')).toEqual(['sev', 'mek']);
    })

    it('should group first two consonant with previous vowel if third consonant is followed by a vowel', () => {
      expect(syllabify('altlık')).toEqual(['alt', 'lık']);
      expect(syllabify('türkçe')).toEqual(['türk', 'çe']);
      expect(syllabify('korkmak')).toEqual(['kork', 'mak']);
    })

    it('should handle loan words according to turkish syllabification rules', () => {
      expect(syllabify('bandrol')).toEqual(['band', 'rol']);
      expect(syllabify('kontrol')).toEqual(['kont', 'rol']);
      expect(syllabify('portre')).toEqual(['port', 're']);
      expect(syllabify('program')).toEqual(['prog', 'ram']);
      expect(syllabify('santral')).toEqual(['sant', 'ral']);
      expect(syllabify('sürpriz')).toEqual(['sürp', 'riz']);
      expect(syllabify('tundra')).toEqual(['tund', 'ra']);
      expect(syllabify('volfram')).toEqual(['volf', 'ram']);
    })
  })

  describe('Consonant clusters', () => {
    it('should handle initial consonant clusters', () => {
      expect(syllabify('trafik')).toEqual(['tra', 'fik']);
      expect(syllabify('program')).toEqual(['prog', 'ram']);
      expect(syllabify('tren')).toEqual(['tren']);
    });

    it('should handle medial consonant clusters', () => {
      expect(syllabify('anlat')).toEqual(['an', 'lat']);
      expect(syllabify('insan')).toEqual(['in', 'san']);
      expect(syllabify('Türkçe')).toEqual(['Türk', 'çe']);
    });

    it('should handle consonant clusters at syllable boundaries', () => {
      expect(syllabify('sandık')).toEqual(['san', 'dık']);
      expect(syllabify('yazlık')).toEqual(['yaz', 'lık']);
      expect(syllabify('renk')).toEqual(['renk']);
    });

    it('should handle 4-consonant clusters based on valid phonetic onsets', () => {
      // Real-world loanword examples with 4-consonant clusters (2-2 split)
      expect(syllabify('transkripsiyon')).toEqual(['trans', 'krip', 'si', 'yon']);
      expect(syllabify('ekspres')).toEqual(['eks', 'pres']);
      expect(syllabify('ekstra')).toEqual(['eks', 'tra']);
      expect(syllabify('enstrüman')).toEqual(['ens', 'trü', 'man']);
      expect(syllabify('transplantasyon')).toEqual(['trans', 'plan', 'tas', 'yon']);
      expect(syllabify('konstrüksiyon')).toEqual(['kons', 'trük', 'si', 'yon']);
      expect(syllabify('eksklüziv')).toEqual(['eks', 'klü', 'ziv']);
      expect(syllabify('abstrakt')).toEqual(['abs', 'trakt']);

      // Synthetic word to test invalid onset (3-1 split fallback)
      expect(syllabify('ansslom')).toEqual(['anss', 'lom']);
    });
  });

  describe('Turkish-specific patterns', () => {
    it('should handle common Turkish words', () => {
      expect(syllabify('merhaba')).toEqual(['mer', 'ha', 'ba']);
      expect(syllabify('teşekkür')).toEqual(['te', 'şek', 'kür']);
      expect(syllabify('lütfen')).toEqual(['lüt', 'fen']);
      expect(syllabify('güle')).toEqual(['gü', 'le']);
    });

    it('should handle compound vowel patterns', () => {
      expect(syllabify('aile')).toEqual(['a', 'i', 'le']);
      expect(syllabify('euro')).toEqual(['e', 'u', 'ro']);
      expect(syllabify('saat')).toEqual(['sa', 'at']);
    });

    it('should handle words with special Turkish characters', () => {
      expect(syllabify('çocuk')).toEqual(['ço', 'cuk']);
      expect(syllabify('şeker')).toEqual(['şe', 'ker']);
      expect(syllabify('öğretmen')).toEqual(['öğ', 'ret', 'men']);
      expect(syllabify('ıspanak')).toEqual(['ıs', 'pa', 'nak']);
    });
  });

  // Inflected forms: Turkish line breaks ignore morpheme boundaries.
  describe('Inflected words', () => {
    it('splits simple inflected plural noun (ev-ler)', () => {
      expect(syllabify('evler')).toEqual(['ev', 'ler']);
    });

    it('splits possessive inflected noun (a-ra-ba-mı-za)', () => {
      expect(syllabify('arabamıza')).toEqual(['a', 'ra', 'ba', 'mı', 'za']);
    });

    it('splits future verb form (gi-de-ce-ğiz)', () => {
      expect(syllabify('gideceğiz')).toEqual(['gi', 'de', 'ce', 'ğiz']);
    });

    it('splits passive future past copula verb form (yap-tı-rı-la-cak-tı)', () => {
      expect(syllabify('yaptırılacaktı')).toEqual(['yap', 'tı', 'rı', 'la', 'cak', 'tı']);
    });

    it('splits complex reciprocal causative passive verb form (dö-vüş-tü-rül-dü-ler)', () => {
      expect(syllabify('dövüştürüldüler')).toEqual(['dö', 'vüş', 'tü', 'rül', 'dü', 'ler']);
    });

    it('splits pronoun accusative form (on-la-rı)', () => {
      expect(syllabify('onları')).toEqual(['on', 'la', 'rı']);
    });

    it('splits pronoun dative form (bun-la-ra)', () => {
      expect(syllabify('bunlara')).toEqual(['bun', 'la', 'ra']);
    });
  });
});
