import * as wanakana from 'wanakana';

export type KanaInputMode = 'hiragana' | 'katakana' | 'romaji';

/**
 * Bản đồ từ viết tắt tiếng Anh (acronyms) sang cách đọc Kana tương ứng
 */
const ACRONYM_MAP: Record<string, string[]> = {
  atm: ['えーてぃーえむ', 'エーティーエム'],
  cd: ['しーでぃー', 'シーディー'],
  dvd: ['でぃーぶいでぃー', 'ディーヴイディー', 'ディーブイディー'],
  'tシャツ': ['ティーシャツ', 'てぃーしゃつ', 'tーシャツ'],
};

/**
 * Chuẩn hóa chuỗi ký tự cơ bản:
 * - Chuyển toàn bộ ký tự số & chữ full-width (！-～) sang half-width ASCII tiêu chuẩn (vd: １００ -> 100)
 * - Bỏ tất cả các dạng dấu ngã (~, ～, 〜, 〰) để không tính dấu ngã khi so sánh đáp án
 * - Bỏ các phần chú thích trong ngoặc đơn/vuông: 住みます［住む］ -> 住みます, 元気（な） -> 元気
 */
export function cleanJapaneseBase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[~～〜〰]/g, '')
    .replace(/[［\[\(（][^］\]\)）]*[］\]\)）]/g, '')
    .trim();
}

/**
 * Phát hiện đáp án mẫu nghiêng về Katakana, Romaji (chữ Latin như ATM, CD) hay Hiragana
 */
export function detectExpectedKanaMode(targetText: string): KanaInputMode {
  if (!targetText) return 'hiragana';
  const clean = targetText.replace(/[\s\d.,/#!$%^&*;:{}=\-_`~()［］（）～〜〰]/g, '');
  if (!clean) return 'hiragana';

  // Nếu từ chủ yếu là chữ cái Latin (ATM, CD, DVD...): tự động chọn Romaji để người dùng gõ trực tiếp
  const latinMatches = clean.match(/[a-zA-Z]/g);
  if (latinMatches && latinMatches.length >= clean.length * 0.5) {
    return 'romaji';
  }

  let katakanaCount = 0;
  for (const char of clean) {
    if (wanakana.isKatakana(char) || char === 'ー') {
      katakanaCount++;
    }
  }

  // Nếu trên 50% ký tự kana là katakana thì ưu tiên Katakana
  return katakanaCount > clean.length / 2 ? 'katakana' : 'hiragana';
}

/**
 * Chuẩn hóa chuỗi tiếng Nhật để so sánh
 */
export function normalizeJapanese(text: string, toTarget: 'hiragana' | 'katakana' | 'romaji' = 'hiragana'): string {
  if (!text) return '';
  const cleaned = cleanJapaneseBase(text);

  if (toTarget === 'hiragana') {
    return wanakana.toHiragana(cleaned).trim();
  } else if (toTarget === 'katakana') {
    return wanakana.toKatakana(cleaned).trim();
  } else {
    return wanakana.toRomaji(cleaned).toLowerCase().trim();
  }
}

/**
 * So sánh đáp án tiếng Nhật giữa người dùng và đáp án mẫu
 */
export interface CompareOptions {
  acceptRomaji?: boolean;
  strictKatakana?: boolean;
}

export function compareJapaneseAnswers(
  userInput: string,
  expectedTarget: string,
  options: CompareOptions = {}
): boolean {
  const { acceptRomaji = true, strictKatakana = false } = options;
  if (!userInput || !expectedTarget) return false;

  const userClean = cleanJapaneseBase(userInput);
  const targetClean = cleanJapaneseBase(expectedTarget);

  if (!userClean || !targetClean) return false;

  // Hỗ trợ trường hợp đáp án có nhiều phương án phân cách bằng dấu gạch chéo: e.g. ～ふん/ぷん
  const targetVariants = targetClean
    .split(/[/／]/)
    .map(s => s.trim())
    .filter(Boolean);
  if (targetVariants.length === 0) targetVariants.push(targetClean);

  // Mở rộng các biến thể ngữ pháp có chữ N (e.g. このN -> この, Nをおねがいします -> おねがいします)
  const expandedVariants: string[] = [];
  for (const v of targetVariants) {
    expandedVariants.push(v);
    const withoutN = v.replace(/N/g, '').replace(/^[を]/, '').trim();
    if (withoutN && withoutN !== v) {
      expandedVariants.push(withoutN);
    }
  }

  for (const variant of expandedVariants) {
    // 1. So khớp trực tiếp hoặc so khớp không phân biệt hoa thường (e.g. atm === ATM)
    if (userClean.toLowerCase() === variant.toLowerCase()) return true;

    // 2. Kiểm tra từ viết tắt (ATM, CD, DVD, Tシャツ)
    const lowerVar = variant.toLowerCase();
    if (ACRONYM_MAP[lowerVar]) {
      const candidates = ACRONYM_MAP[lowerVar];
      if (
        candidates.includes(userClean) ||
        candidates.includes(wanakana.toHiragana(userClean)) ||
        candidates.includes(wanakana.toKatakana(userClean))
      ) {
        return true;
      }
    }
    const lowerUser = userClean.toLowerCase();
    if (ACRONYM_MAP[lowerUser] && (ACRONYM_MAP[lowerUser].includes(variant) || lowerUser === lowerVar)) {
      return true;
    }

    // 3. Chuẩn hóa số đặc thù: 100 <-> ひゃく, 円 <-> えん
    const variantNormEn = variant.replace(/円/g, 'えん');
    const userNormEn = userClean.replace(/円/g, 'えん');

    const variantWithWords = variantNormEn.replace(/100/g, 'ひゃく');
    const userWithWords = userNormEn.replace(/100/g, 'ひゃく');
    const variantWithNums = variantNormEn.replace(/ひゃく/g, '100');
    const userWithNums = userNormEn.replace(/ひゃく/g, '100');

    // 4. Nếu bài kiểm tra bắt buộc Katakana chuẩn (từ mượn, Katakana chart)
    if (strictKatakana) {
      const userKata = wanakana.toKatakana(userClean);
      const targetKata = wanakana.toKatakana(variant);
      if (userKata === targetKata) return true;
      if (wanakana.toKatakana(userWithWords) === wanakana.toKatakana(variantWithWords)) return true;
    }

    // 5. Chuẩn hóa cả hai về Hiragana (taberu -> たべる, タベル -> たべる)
    const userHira = wanakana.toHiragana(userClean);
    const targetHira = wanakana.toHiragana(variant);
    if (userHira === targetHira) return true;
    if (wanakana.toHiragana(userWithWords) === wanakana.toHiragana(variantWithWords)) return true;
    if (wanakana.toHiragana(userWithNums) === wanakana.toHiragana(variantWithNums)) return true;

    // 6. Chuẩn hóa cả hai về Romaji (để xử lý cách gõ si/shi, tu/tsu, ou/oo/ō, t-shatsu)
    if (acceptRomaji || wanakana.isRomaji(userClean)) {
      const cleanRomaji = (str: string) =>
        wanakana
          .toRomaji(str)
          .toLowerCase()
          .replace(/[-ー_]/g, '')
          .replace(/ou/g, 'oo')
          .replace(/ō/g, 'oo')
          .replace(/ū/g, 'uu')
          .trim();

      const uRom = cleanRomaji(userClean);
      const vRom = cleanRomaji(variant);
      if (uRom === vRom) return true;

      if (cleanRomaji(userWithWords) === cleanRomaji(variantWithWords)) return true;
      if (cleanRomaji(userWithNums) === cleanRomaji(variantWithNums)) return true;
    }
  }

  return false;
}

/**
 * Chuẩn hóa tiếng Việt để kiểm tra nghĩa (bỏ dấu ngoặc, dấu ngã ~, từ đồng nghĩa)
 */
export function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // bỏ phần trong ngoặc
    .replace(/[［\[\(（][^］\]\)）]*[］\]\)）]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()～〜〰]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compareViMeanings(userInput: string, expectedMeaning: string): boolean {
  if (!userInput || !expectedMeaning) return false;

  const normUser = normalizeVi(userInput);
  const normExpected = normalizeVi(expectedMeaning);

  if (normUser === normExpected) return true;

  // Tách các từ đồng nghĩa (phân cách bởi dấu phẩy hoặc chấm phẩy)
  const synonyms = expectedMeaning
    .split(/[,;/]/)
    .map(s => normalizeVi(s))
    .filter(Boolean);

  if (synonyms.includes(normUser)) return true;

  // Nếu chuỗi người dùng chứa trọn vẹn nghĩa cốt lõi hoặc ngược lại
  if (normUser.length >= 2 && normExpected.includes(normUser)) {
    return true;
  }

  return false;
}

export { wanakana };
