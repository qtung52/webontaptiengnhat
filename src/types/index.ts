export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'Chung';

export interface SRSData {
  repetition: number;      // Số lần ôn tập thành công liên tiếp
  interval: number;        // Khoảng cách ngày đến lần ôn tiếp theo
  easeFactor: number;      // Hệ số dễ (SM-2, mặc định 2.5)
  dueDate: string;         // Ngày ôn tiếp theo (ISO string YYYY-MM-DD)
  lastReviewed?: string;   // Lần ôn gần nhất (ISO string)
  consecutiveMistakes: number;
}

export interface VocabWord {
  id: string;
  japanese: string;        // Tiếng Nhật (kanji hoặc kana)
  reading: string;         // Cách đọc (furigana/kana)
  hanViet?: string;        // Âm Hán Việt
  meaningVi: string;       // Nghĩa tiếng Việt
  example?: string;        // Câu ví dụ tiếng Nhật + dịch
  level?: JLPTLevel;       // Cấp độ N5 - N1
  topic?: string;          // Chủ đề hoặc bài (vd: Bài 1, Đồ ăn)
  deckId: string;          // ID bộ từ chứa từ này
  createdAt: string;
  isMastered?: boolean;    // Đã thuộc hay chưa
  srs?: SRSData;
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  level?: JLPTLevel;
  isCustom?: boolean;
  createdAt: string;
}

export type KanaType = 'basic' | 'dakuten' | 'handakuten' | 'yoon';

export interface KanaItem {
  id: string;
  hiragana: string;
  katakana: string;
  romaji: string;
  type: KanaType;
  mnemonicEmoji: string;
  mnemonicNoteVi: string;  // Câu gợi nhớ tiếng Việt
  comparisonNote?: string; // So sánh Hiragana vs Katakana
  row?: string;            // a, ka, sa, ta, na, ha, ma, ya, ra, wa
}

export interface KanjiItem {
  id: string;
  kanji: string;
  on: string[];            // Âm On (Katakana)
  kun: string[];           // Âm Kun (Hiragana)
  hanViet: string;         // Âm Hán Việt (vd: NHẬT, NGUYỆT)
  meaningVi: string;       // Nghĩa tiếng Việt
  radical: string;         // Bộ thủ (vd: 日 - Nhật)
  strokes: number;         // Số nét
  level: JLPTLevel;
  mnemonicEmoji: string;
  mnemonicNoteVi: string;  // Câu chuyện gợi nhớ
  topic?: string;          // Bài học (vd: JPD113 - Bài 1)
  examples: {
    word: string;
    reading: string;
    meaning: string;
  }[];
}

export interface AppSettings {
  furigana: boolean;           // Bật/tắt Furigana
  autoConvertKana: boolean;    // WanaKana: Tự chuyển Romaji -> Kana
  acceptRomaji: boolean;       // Chấp nhận gõ Romaji làm đáp án đúng
  soundEnabled: boolean;       // Phát âm thanh
  theme: 'light' | 'dark';     // Giao diện sáng / tối
  speechSpeed: number;         // Tốc độ đọc 0.7 - 1.2
}

export interface UserStats {
  streak: number;
  lastStudyDate: string;       // YYYY-MM-DD
  totalMastered: number;
  history: Record<string, { total: number; correct: number }>; // theo ngày
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  className?: string;          // Lớp hoặc khóa học
  createdAt: string;
  lastSyncedAt?: string;
}

export type StudyMode = 
  | 'flashcard' 
  | 'typing' 
  | 'quiz' 
  | 'write' 
  | 'match' 
  | 'test' 
  | 'srs';

