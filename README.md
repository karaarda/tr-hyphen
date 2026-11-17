# tr-hyphen

Turkish syllabification and hyphenation following the TDK spelling rules, with no dependencies.

```sh
npm install tr-hyphen
```

ESM only; Node 18 or later, or any modern bundler.

```ts
import { hyphenate, hyphenateText, syllabify } from 'tr-hyphen';

syllabify('öğretmen');          // ['öğ', 'ret', 'men']
hyphenate('merhaba');           // 'mer-ha-ba'
hyphenate('uçurtma');           // 'uçurt-ma'   (never u-çurtma)
hyphenateText('Ankara’dan geldim');
// 'An­ka­ra’​dan gel­dim' (soft hyphens, and a zero-width space after the apostrophe)
```

## The rules

From TDK, *[Hece yapısı ve satır sonunda kelimelerin bölünmesi](https://tdk.gov.tr/icerik/yazim-kurallari/hece-yapisi-ve-satir-sonunda-kelimelerin-bolunmesi/)*.
Every example on that page is in the test suite.

- **Syllables.** A consonant between two vowels starts the next syllable (`a-ra-ba`). Of two
  consonants, the first closes the syllable and the second opens the next (`sev-mek`). Of three,
  the first two close it (`Türk-çe`). Loanwords follow the same rules (`kont-rol`, `prog-ram`),
  and so do compounds written as one word (`ba-şöğ-ret-men`).
- **Line breaks** fall between syllables, with a hyphen at the end of the line. A word may be
  divided at any syllable boundary, even inside a stem or a suffix (also Göksel & Kerslake,
  *Turkish: A Comprehensive Grammar*).
- **No single letter** is left at the end or start of a line: `uçurt-ma`, not `u-çurtma`;
  `müda-faa`, not `müdafa-a`.
- **Apostrophes.** A line may break right after an apostrophe, and then no hyphen is written:
  `Ankara’ / dan`, `1996’ / da`.

## API

### `syllabify(word: string): string[]`
Splits one word into syllables. Letters are classified with Turkish casing (`I`→`ı`, `İ`→`i`)
and the syllables keep the original spelling: `syllabify('IRMAK')` is `['IR', 'MAK']`. The
circumflexed vowels `â`, `î`, `û` count as vowels. It does no clean-up: pass it a bare word.

### `hyphenationPoints(word: string, options?): HyphenationPoint[]`
Where a line may break. Each point is `{ index, hyphen }`: `index` is the first character after
the break, and `hyphen` is `false` for a break right after an apostrophe, where no hyphen is
written.

```ts
hyphenationPoints('Edirne’nin'); // [{ index: 4, hyphen: true }, { index: 7, hyphen: false }]
```

### `hyphenate(word: string, options?): string`
Writes `separator` (default `'-'`) at syllable breaks and `apostropheBreak` (default `''`) after
an apostrophe.

### `hyphenateText(text: string, options?): string`
Hyphenates every word in running text and leaves everything else as it is. The defaults suit
HTML with CSS `hyphens: manual`: a soft hyphen (`U+00AD`, `SOFT_HYPHEN`) at syllable breaks, and
a zero-width space (`U+200B`, `ZERO_WIDTH_SPACE`) after apostrophes so the browser may break
there without a hyphen.

### Options
| Option | Default | Meaning |
|---|---|---|
| `minLeft` | `2` | Minimum letters or digits before a break. |
| `minRight` | `2` | Minimum letters or digits after a break. |
| `separator` | `'-'` / `U+00AD` | Written at syllable breaks by `hyphenate` / `hyphenateText`. |
| `apostropheBreak` | `''` / `U+200B` | Written after an apostrophe by `hyphenate` / `hyphenateText`. |

## Where TDK is silent

These choices keep every returned break correct, at the cost of skipping some possible ones:
- **Punctuation** around a word is ignored: `"evler",` → `"ev-ler",`.
- **Apostrophes:** no syllable contains an apostrophe. The name and the suffix are divided on
  their own, and the line may break after the apostrophe: `Ahmet’in` is `Ah-met’in`, with breaks
  `Ah-` / `met’in` and `Ahmet’` / `in`, never `Ahme-` / `t’in`.
- **Numbers and abbreviations** before an apostrophe stay whole, but the line may break after
  the apostrophe, as in TDK's `1996’ / da`: `TBMM’ / ye`.
- **Existing hyphens:** each part of `anne-baba` is divided on its own, but never next to the
  existing hyphen, since a line can already break after it.
- **Non-Turkish letters:** a word containing `q`, `w`, `x` or any other letter outside the Turkish
  alphabet (`Washington`, `examen`) is not divided, except after an apostrophe.

Input should be NFC-normalized; a word with combining marks is not divided.

## License

[MIT](LICENSE) © Arda Kara
