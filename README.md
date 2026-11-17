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

The test suite covers the syllable divisions and the accepted and rejected line breaks shown in
TDK’s [Hece Yapısı ve Satır Sonunda Kelimelerin Bölünmesi](https://tdk.gov.tr/icerik/yazim-kurallari/hece-yapisi-ve-satir-sonunda-kelimelerin-bolunmesi/).
The same examples appear in the [2026 online spelling guide](https://yazim.tdk.gov.tr/content/09-noktalama-isaretleri.html).

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
circumflexed vowels `â`, `î`, `û` count as vowels. Pass a bare word in NFC. TDK documents the
spelling of these vowels in [Düzeltme İşareti](https://tdk.gov.tr/icerik/yazim-kurallari/duzeltme-isareti/).

### `hyphenationPoints(word: string, options?): HyphenationPoint[]`
Where a line may break. Each point is `{ index, hyphen }`. Use `index` directly with
JavaScript’s `slice` to split the string at the break. `hyphen` is `false` for a break right
after an apostrophe.

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

The default minima enforce TDK’s single-letter rule. Setting either minimum to `1` can allow
single-letter fragments.

## Package conventions

- **Punctuation** around a word is ignored: `"evler",` → `"ev-ler",`.
- **Apostrophes:** no syllable contains an apostrophe. The name and the suffix are divided on
  their own, and the line may break after the apostrophe: `Ahmet’in` is `Ah-met’in`, with breaks
  `Ah-` / `met’in` and `Ahmet’` / `in`. A part with multiple apostrophes stays whole.
- **Numbers and abbreviations** before an apostrophe stay whole, but the line may break after
  the apostrophe, as in TDK's `1996’ / da`: `TBMM’ / ye`.
- **Existing ASCII hyphens:** each part of `anne-baba` is divided on its own, but never next to the
  existing hyphen, since a line can already break after it.
- **Non-Turkish letters:** a word containing `q`, `w`, `x` or any other letter outside the Turkish
  alphabet (`Washington`, `examen`) is not divided, except after an apostrophe.
- **Long consonant clusters:** for runs of four or more consonants, `syllabify` can group a
  two-consonant onset such as `tr` in `eks-tra`. This is a package heuristic.

Use NFC-normalized input. The line-breaking functions skip syllable breaks within parts that
contain combining marks.

## Corpus comparison

The Universal Dependencies Turkish [BOUN](https://github.com/UniversalDependencies/UD_Turkish-BOUN)
and [IMST](https://universaldependencies.org/treebanks/tr_imst/) r2.17 test splits contain 2,079
sentences from published Turkish text. Comparing break offsets and marker types with Hyphenopoly
6.1.0 gave the following counts.

| Hyphenopoly `minWordLength` | Compared tokens | Tokens with different breaks | Shared break markers |
|---|---:|---:|---:|
| `6` (default) | 17,639 | 4,479 (25.4%) | 23,744 |
| `4` | 17,639 | 615 (3.5%) | 27,729 |

At `4`, `tr-hyphen` emitted 301 additional soft hyphens and 359 additional zero-width spaces.
Hyphenopoly emitted 11 additional soft hyphens and 77 additional zero-width spaces. The corpora
are annotated for syntax, so these are agreement counts. The test suite checks selected differences
with expected breaks derived from TDK's rules or the package conventions above.

To reproduce the comparison, download the original corpora and install Hyphenopoly in a temporary
directory. Use `6` in the final command to compare its defaults. The JSON output includes the
disagreeing word forms and their frequencies.

```sh
workdir=$(mktemp -d)
npm install --prefix "$workdir" --ignore-scripts hyphenopoly@6.1.0
curl -fLsS https://raw.githubusercontent.com/UniversalDependencies/UD_Turkish-BOUN/r2.17/tr_boun-ud-test.conllu -o "$workdir/boun.conllu"
curl -fLsS https://raw.githubusercontent.com/UniversalDependencies/UD_Turkish-IMST/r2.17/tr_imst-ud-test.conllu -o "$workdir/imst.conllu"
npm run build
node bench/compare-corpus.mjs "$workdir/node_modules/hyphenopoly/hyphenopoly.module.js" 4 "$workdir/boun.conllu" "$workdir/imst.conllu"
```

## Performance

Run `npm run bench` to measure throughput on running Turkish text and a 32,000-letter token.
`npm test` includes a regression test for the long token.

To measure the built package in headless Chrome at normal speed and with 6× CPU throttling,
use the same corpus files as above. Set `BASELINE_DIR` to a previous build's `dist` directory
to compare timings and verify identical output. Each result is the median of nine warmed runs.

```sh
npm run build
node bench/browser-cpu.mjs "$chrome_executable" "$workdir/boun.conllu" "$workdir/imst.conllu"
```

For EPUBs, apply `hyphenateText` to Turkish XHTML text nodes during book generation when you
control the build. The resulting text contains discretionary break markers and can be read without
running JavaScript. Verify line wrapping on the target reading system. The Chrome benchmark times
text processing under CPU throttling. Device memory, rendering and scripting support vary by reader.

## License

[MIT](LICENSE) © Arda Kara
