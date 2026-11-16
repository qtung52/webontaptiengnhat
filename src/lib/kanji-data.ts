import manabimanKanjiData from '@/data/manabiman-kanji.json';
import manabimanKanjiVocabData from '@/data/manabiman-kanji-vocab.json';
import { KanjiItem, JLPTLevel } from '@/types';

export const allKanjiList: KanjiItem[] = manabimanKanjiData as KanjiItem[];

export const KANJI_TOPICS = [
  'JPD113 - Bài 1: Giới thiệu bản thân và Trường học',
  'JPD113 - Bài 2: Số đếm và Tiền tệ',
  'JPD113 - Bài 3: Ngày tháng và Thời gian',
  'JPD123 - Bài 4: Phương hướng và Địa danh',
  'JPD123 - Bài 5: Thời gian và Hành động hằng ngày',
  'JPD123 - Bài 6: Động từ chuyển động và Giao tiếp',
  'JPD123 - Bài 7: Thiên nhiên, Món ăn và Cuộc sống',
  'JPD133 - Bài 8: Gia đình và Miêu tả tính chất',
  'JPD133 - Bài 9: Sở thích, Nghệ thuật và Du lịch',
  'JPD133 - Bài 10: Giao thông và Phương hướng',
  'JPD133 - Bài 11: Sinh hoạt, Học tập và Thời gian',
] as const;

// Bản đồ tra cứu nhanh Kanji -> Hán Việt & nghĩa
export const kanjiMap = new Map<string, { kanji: string; hanViet: string; meaningVi: string }>();
allKanjiList.forEach(k => {
  kanjiMap.set(k.kanji, { kanji: k.kanji, hanViet: k.hanViet, meaningVi: k.meaningVi });
});

// Tính âm Hán Việt ghép cho một từ (vd: "一日" -> "NHẤT NHẬT")
export function getCompoundHanViet(word: string): string {
  const chars = [...word];
  const parts: string[] = [];
  for (const c of chars) {
    if (kanjiMap.has(c)) {
      parts.push(kanjiMap.get(c)!.hanViet);
    }
  }
  return parts.join(' ');
}

export interface KanjiVocabItem {
  id: string;
  word: string;           // Từ vựng chữ Hán (vd: "一日", "一月", "大学")
  reading: string;        // Cách đọc Kana (vd: "ついたち", "いちがつ", "だいがく")
  meaningVi: string;      // Nghĩa tiếng Việt (vd: "Ngày mồng 1", "Tháng 1")
  romaji?: string;        // Romaji (vd: "tsuitachi")
  hanViet: string;        // Âm Hán Việt ghép (vd: "NHẤT NHẬT")
  relatedKanji: string[]; // Các chữ Hán cấu thành (vd: ["一", "日"])
  level: JLPTLevel;       // Cấp độ N5, N4, N3
  topic: string;          // Bài học (vd: "JPD113 - Bài 2: Số đếm và Tiền tệ")
  lessonSlug?: string;    // Slug bài học (vd: "jpd113-l2")
  notes: { kanji: string; hanViet: string; meaningVi: string }[];
}

// Chuyển đổi dữ liệu 311 từ vựng Hán tự gốc Manabiman thành dạng chuẩn
export const allKanjiVocabList: KanjiVocabItem[] = (manabimanKanjiVocabData as any[]).map((v, idx) => {
  const related = [...v.word].filter(c => kanjiMap.has(c));
  const hanViet = getCompoundHanViet(v.word);
  const notes = related.map(c => kanjiMap.get(c)!);

  return {
    id: `kv_${idx}`,
    word: v.word,
    reading: v.reading,
    meaningVi: v.meaning,
    romaji: v.romaji,
    hanViet: hanViet || '',
    relatedKanji: related,
    level: (v.level as JLPTLevel) || 'N5',
    topic: v.topic || '',
    lessonSlug: v.lessonSlug,
    notes,
  };
});

export function getAllKanjiVocab(): KanjiVocabItem[] {
  return allKanjiVocabList;
}

export function getKanjiVocabFiltered(level: JLPTLevel | 'ALL', topic: string): KanjiVocabItem[] {
  let list = allKanjiVocabList;
  if (level !== 'ALL') {
    list = list.filter(k => k.level === level);
  }
  if (topic !== 'ALL') {
    const cleanTopic = topic.trim().toLowerCase();
    list = list.filter(k => {
      if (!k.topic) return false;
      const kTopic = k.topic.toLowerCase();
      return kTopic === cleanTopic || kTopic.includes(cleanTopic) || cleanTopic.includes(kTopic);
    });
  }
  return list;
}

/**
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu, chuyển chữ thường, bỏ khoảng trắng thừa)
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * So sánh âm Hán Việt người dùng nhập với đáp án chuẩn
 * Chấp nhận cả có dấu hoặc không dấu, hoa thường bất kỳ
 */
export function compareHanViet(input: string, targetHanViet: string): boolean {
  if (!input || !targetHanViet) return false;
  const rawInput = input.trim().toLowerCase();
  const rawTarget = targetHanViet.trim().toLowerCase();
  if (rawInput === rawTarget) return true;

  const cleanInput = removeVietnameseAccents(input);
  const cleanTarget = removeVietnameseAccents(targetHanViet);
  return cleanInput === cleanTarget;
}

/**
 * Xáo trộn mảng ngẫu nhiên (Fisher-Yates)
 */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface KanjiVocabQuizQuestion {
  id: string;
  type: 'word_to_reading' | 'meaning_to_word' | 'word_to_hanviet' | 'word_to_meaning';
  question: string;
  subPrompt: string;
  vocabItem: KanjiVocabItem;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

/**
 * Sinh câu hỏi trắc nghiệm thực tế cho bộ TỪ VỰNG CHỮ HÁN
 */
export function generateKanjiVocabQuizList(vocabList: KanjiVocabItem[], count: number = 15): KanjiVocabQuizQuestion[] {
  if (vocabList.length === 0) return [];

  const shuffledPool = shuffleArray(vocabList);
  const totalQuestions = Math.min(count, shuffledPool.length);
  const questions: KanjiVocabQuizQuestion[] = [];

  for (let i = 0; i < totalQuestions; i++) {
    const item = shuffledPool[i % shuffledPool.length];
    // Các dạng câu hỏi:
    // 0: Cho từ chữ Hán -> Chọn cách đọc Kana (vd: 一日 -> ついたち)
    // 1: Cho nghĩa & cách đọc -> Chọn từ chữ Hán (vd: "Ngày mồng 1 [ついたち]" -> 一日)
    // 2: Cho từ chữ Hán -> Chọn nghĩa tiếng Việt (vd: 一日 -> Ngày mồng 1)
    const availableTypes = [0, 1, 2];
    const qType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    if (qType === 0) {
      // Dạng 0: Từ chữ Hán -> Cách đọc Kana
      const correctAnswer = item.reading;
      const distractors = shuffleArray(
        allKanjiVocabList
          .filter(v => v.id !== item.id && v.reading !== item.reading)
          .map(v => v.reading)
      ).slice(0, 3);

      const options = shuffleArray([correctAnswer, ...distractors]);
      questions.push({
        id: `q_read_${item.id}_${i}`,
        type: 'word_to_reading',
        question: item.word,
        subPrompt: `Từ vựng chữ Hán này có cách đọc (Furigana) là gì? (Nghĩa: ${item.meaningVi})`,
        vocabItem: item,
        options,
        correctAnswer,
        explanation: `Từ 【${item.word}】 đọc là 【${item.reading}】${item.hanViet ? ` (${item.hanViet})` : ''} mang nghĩa "${item.meaningVi}".`,
      });
    } else if (qType === 1) {
      // Dạng 1: Nghĩa & Cách đọc -> Chọn từ chữ Hán đúng
      const correctAnswer = item.word;
      const distractors = shuffleArray(
        allKanjiVocabList
          .filter(v => v.id !== item.id && v.word !== item.word)
          .map(v => v.word)
      ).slice(0, 3);

      const options = shuffleArray([correctAnswer, ...distractors]);
      questions.push({
        id: `q_word_${item.id}_${i}`,
        type: 'meaning_to_word',
        question: `${item.meaningVi} [${item.reading}]`,
        subPrompt: 'Chọn từ vựng chữ Hán tương ứng với nghĩa và cách đọc trên:',
        vocabItem: item,
        options,
        correctAnswer,
        explanation: `Nghĩa "${item.meaningVi}" (cách đọc 【${item.reading}】) tương ứng với từ chữ Hán 【${item.word}】${item.hanViet ? ` (${item.hanViet})` : ''}.`,
      });
    } else {
      // Dạng 2: Từ chữ Hán -> Nghĩa tiếng Việt
      const correctAnswer = item.meaningVi;
      const distractors = shuffleArray(
        allKanjiVocabList
          .filter(v => v.id !== item.id && v.meaningVi !== item.meaningVi)
          .map(v => v.meaningVi)
      ).slice(0, 3);

      const options = shuffleArray([correctAnswer, ...distractors]);
      questions.push({
        id: `q_meaning_${item.id}_${i}`,
        type: 'word_to_meaning',
        question: item.word,
        subPrompt: `Từ chữ Hán này mang nghĩa tiếng Việt là gì? [Cách đọc: ${item.reading}]`,
        vocabItem: item,
        options,
        correctAnswer,
        explanation: `Từ 【${item.word}】 đọc là 【${item.reading}】${item.hanViet ? ` (${item.hanViet})` : ''} có nghĩa là "${item.meaningVi}".`,
      });
    }
  }

  return questions;
}
