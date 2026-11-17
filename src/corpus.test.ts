import { hyphenateText, SOFT_HYPHEN, ZERO_WIDTH_SPACE } from './index.js';

// Words observed in the UD Turkish BOUN and IMST r2.17 test splits.
// Expected breaks are based on the TDK rules and the package's punctuation conventions.
describe('breaks in words from published Turkish text', () => {
  it.each([
    ['İşte', 'İş·te'],
    ['İstanbul', 'İs·tan·bul'],
    ['İnceleme', 'İn·ce·le·me'],
    ['DAKİKA', 'DA·Kİ·KA'],
    ['gidecek', 'gi·de·cek'],
    ['yapabilecek', 'ya·pa·bi·le·cek'],
    ['değiştirecek', 'de·ğiş·ti·re·cek'],
    ['aile', 'ai·le'],
    ['faaliyet', 'fa·a·li·yet'],
    ['cezaevi', 'ce·za·e·vi'],
    ['stratejik', 'stra·te·jik'],
    ['stratejistlerin', 'stra·te·jist·le·rin'],
    ["Türkiye'nin", "Tür·ki·ye'|nin"],
    ["Taşhan'ın", "Taş·han'|ın"],
    ["ABD'nin", "ABD'|nin"],
    ["THKO'ya", "THKO'|ya"],
    ["1992'de", "1992'|de"],
    ['çizgi-roman', 'çiz·gi-ro·man'],
    ['-Hayır', '-Ha·yır'],
    ['Skype', 'Skype'],
  ])('formats %s', (word, expected) => {
    const formatted = expected.replace(/·/g, SOFT_HYPHEN).replace(/\|/g, ZERO_WIDTH_SPACE);
    expect(hyphenateText(word)).toBe(formatted);
  });
});
