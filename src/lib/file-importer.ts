import Papa from 'papaparse';
import { VocabWord, JLPTLevel } from '@/types';

export interface ColumnMapping {
  japanese: string;
  reading: string;
  hanViet: string;
  meaningVi: string;
  example: string;
  level: string;
  topic: string;
}

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  detectedMapping: ColumnMapping;
  errors: { row: number; reason: string }[];
}

export interface ProcessedVocabResult {
  validWords: Partial<VocabWord>[];
  errors: { row: number; line: string; reason: string }[];
}

// Từ khóa gợi ý để tự động khớp cột
const COLUMN_KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  japanese: ['tiếng nhật', 'nhật', 'từ vựng', 'từ', 'kanji', 'japanese', 'word', 'nihongo', 'tu_vung'],
  reading: ['cách đọc', 'đọc', 'reading', 'kana', 'furigana', 'hiragana', 'katakana', 'cach_doc'],
  hanViet: ['hán việt', 'âm hán', 'hanviet', 'han viet', 'han_viet', 'sino'],
  meaningVi: ['nghĩa', 'nghĩa tiếng việt', 'ý nghĩa', 'nghia', 'meaning', 'vietnamese', 'dịch'],
  example: ['ví dụ', 'vi du', 'câu ví dụ', 'example', 'sentence', 'vi_du'],
  level: ['cấp độ', 'trình độ', 'level', 'jlpt', 'cap_do'],
  topic: ['chủ đề', 'bài', 'topic', 'lesson', 'chu_de', 'nhóm'],
};

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    japanese: '',
    reading: '',
    hanViet: '',
    meaningVi: '',
    example: '',
    level: '',
    topic: '',
  };

  const lowerHeaders = headers.map(h => h.trim().toLowerCase());

  (Object.keys(COLUMN_KEYWORDS) as (keyof ColumnMapping)[]).forEach(field => {
    const keywords = COLUMN_KEYWORDS[field];
    const foundIdx = lowerHeaders.findIndex(h =>
      keywords.some(kw => h === kw || h.includes(kw))
    );
    if (foundIdx !== -1) {
      mapping[field] = headers[foundIdx];
    }
  });

  // Nếu không thấy thì gán theo thứ tự phổ biến: [từ, đọc, hán việt, nghĩa, ví dụ, cấp độ, bài]
  if (!mapping.japanese && headers.length > 0) mapping.japanese = headers[0];
  if (!mapping.reading && headers.length > 1) mapping.reading = headers[1];
  if (!mapping.meaningVi) {
    if (headers.length > 3) mapping.meaningVi = headers[3];
    else if (headers.length > 2) mapping.meaningVi = headers[2];
  }

  return mapping;
}

/**
 * Đọc file CSV
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: h => h.trim(),
      complete: results => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, string>[]).filter(r =>
          Object.values(r).some(v => v && String(v).trim().length > 0)
        );
        const detectedMapping = autoDetectMapping(headers);
        const errors = results.errors.map(e => ({
          row: e.row || 0,
          reason: e.message,
        }));
        resolve({ headers, rows, detectedMapping, errors });
      },
      error: err => reject(err),
    });
  });
}

/**
 * Đọc file XLSX / XLS
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Chuyển sang JSON dạng object header
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
  });

  if (rawData.length === 0) {
    return {
      headers: [],
      rows: [],
      detectedMapping: {
        japanese: '',
        reading: '',
        hanViet: '',
        meaningVi: '',
        example: '',
        level: '',
        topic: '',
      },
      errors: [{ row: 1, reason: 'File Excel không có dữ liệu hoặc sheet trống.' }],
    };
  }

  const headers = Object.keys(rawData[0]).map(h => h.trim());
  const rows = rawData.map(r => {
    const rowObj: Record<string, string> = {};
    headers.forEach(h => {
      rowObj[h] = String(r[h] ?? '').trim();
    });
    return rowObj;
  });

  const detectedMapping = autoDetectMapping(headers);

  return {
    headers,
    rows,
    detectedMapping,
    errors: [],
  };
}

/**
 * Đọc file JSON
 */
export async function parseJSONFile(file: File): Promise<ParseResult> {
  const text = await file.text();
  const json = JSON.parse(text);
  const list = Array.isArray(json) ? json : json.words || json.data || [];

  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('Định dạng file JSON phải là một mảng các từ vựng.');
  }

  const headers = Object.keys(list[0]);
  const rows = list.map(item => {
    const r: Record<string, string> = {};
    headers.forEach(h => {
      r[h] = String(item[h] ?? '').trim();
    });
    return r;
  });

  return {
    headers,
    rows,
    detectedMapping: autoDetectMapping(headers),
    errors: [],
  };
}

/**
 * Nhập từ văn bản dán nhiều dòng: "từ | cách đọc | nghĩa | ví dụ | bài"
 * Tự nhận dạng dấu phân cách |, tab (\t), hoặc dấu phẩy (,)
 */
export function parsePastedText(rawText: string): ProcessedVocabResult {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const validWords: Partial<VocabWord>[] = [];
  const errors: { row: number; line: string; reason: string }[] = [];

  lines.forEach((line, index) => {
    const rowNum = index + 1;
    // Bỏ qua dòng comment
    if (line.startsWith('#') || line.startsWith('//')) return;

    // Tự phát hiện delimiter
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else {
      parts = line.split(/\s{2,}/); // 2 khoảng trắng trở lên
    }

    const cleanParts = parts.map(p => p.trim());

    if (cleanParts.length < 2) {
      errors.push({
        row: rowNum,
        line,
        reason: 'Thiếu thông tin (cần tối thiểu từ tiếng Nhật và nghĩa)',
      });
      return;
    }

    // [0]: Từ Nhật, [1]: Cách đọc (hoặc nghĩa nếu chỉ có 2 phần), [2]: Nghĩa, [3]: Hán Việt / Ví dụ...
    let japanese = cleanParts[0];
    let reading = cleanParts[1];
    let meaningVi = '';
    let hanViet = '';
    let example = '';

    if (cleanParts.length === 2) {
      // Dạng "tiếng Nhật | nghĩa"
      meaningVi = cleanParts[1];
      reading = cleanParts[0]; // Nếu không có cách đọc thì coi như là kana luôn
    } else if (cleanParts.length === 3) {
      // Dạng "tiếng Nhật | cách đọc | nghĩa"
      meaningVi = cleanParts[2];
    } else if (cleanParts.length === 4) {
      // Dạng "tiếng Nhật | cách đọc | hán việt | nghĩa"
      hanViet = cleanParts[2];
      meaningVi = cleanParts[3];
    } else {
      // Dạng đầy đủ: nhật | đọc | hán việt | nghĩa | ví dụ
      hanViet = cleanParts[2];
      meaningVi = cleanParts[3];
      example = cleanParts[4];
    }

    if (!japanese || !meaningVi) {
      errors.push({
        row: rowNum,
        line,
        reason: 'Không tìm thấy từ tiếng Nhật hoặc nghĩa tiếng Việt',
      });
      return;
    }

    validWords.push({
      japanese,
      reading: reading || japanese,
      hanViet,
      meaningVi,
      example,
    });
  });

  return { validWords, errors };
}

/**
 * Chuyển đổi các hàng đã map cột thành danh sách từ hợp lệ
 */
export function convertMappedRowsToVocab(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  deckId: string
): ProcessedVocabResult {
  const validWords: Partial<VocabWord>[] = [];
  const errors: { row: number; line: string; reason: string }[] = [];

  rows.forEach((r, idx) => {
    const rowNum = idx + 2; // header là dòng 1
    const japanese = (r[mapping.japanese] || '').trim();
    const reading = (r[mapping.reading] || '').trim();
    const meaningVi = (r[mapping.meaningVi] || '').trim();
    const hanViet = (r[mapping.hanViet] || '').trim();
    const example = (r[mapping.example] || '').trim();
    const levelRaw = (r[mapping.level] || '').trim().toUpperCase() as JLPTLevel;
    const topic = (r[mapping.topic] || '').trim();

    if (!japanese && !reading) {
      errors.push({
        row: rowNum,
        line: JSON.stringify(r),
        reason: 'Dòng trống: thiếu cả từ tiếng Nhật và cách đọc.',
      });
      return;
    }

    if (!meaningVi) {
      errors.push({
        row: rowNum,
        line: `${japanese} - ${reading}`,
        reason: 'Thiếu nghĩa tiếng Việt.',
      });
      return;
    }

    const validLevel: JLPTLevel = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(levelRaw)
      ? levelRaw
      : 'N5';

    validWords.push({
      id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      japanese: japanese || reading,
      reading: reading || japanese,
      meaningVi,
      hanViet,
      example,
      level: validLevel,
      topic: topic || 'Chưa phân loại',
      deckId,
      createdAt: new Date().toISOString(),
    });
  });

  return { validWords, errors };
}

/**
 * Tạo file mẫu để tải về (CSV, XLSX, JSON)
 */
export async function downloadSampleTemplate(format: 'csv' | 'xlsx' | 'json') {
  const sampleData = [
    {
      'Tiếng Nhật': '食べる',
      'Cách đọc': 'たべる',
      'Hán Việt': 'THỰC',
      'Nghĩa tiếng Việt': 'Ăn',
      'Ví dụ': '朝ご飯を食べます (Tôi ăn sáng)',
      'Cấp độ': 'N5',
      'Chủ đề': 'Bài 6 - Động từ',
    },
    {
      'Tiếng Nhật': '飲む',
      'Cách đọc': 'のむ',
      'Hán Việt': 'ẨM',
      'Nghĩa tiếng Việt': 'Uống',
      'Ví dụ': 'お茶を飲みます (Tôi uống trà)',
      'Cấp độ': 'N5',
      'Chủ đề': 'Bài 6 - Động từ',
    },
    {
      'Tiếng Nhật': '本',
      'Cách đọc': 'ほん',
      'Hán Việt': 'BẢN',
      'Nghĩa tiếng Việt': 'Quyển sách',
      'Ví dụ': 'これは日本語の本です (Đây là sách tiếng Nhật)',
      'Cấp độ': 'N5',
      'Chủ đề': 'Bài 2 - Đồ vật',
    },
  ];

  if (format === 'csv') {
    const csvStr = Papa.unparse(sampleData);
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, 'kotoba_dojo_mau_tu_vung.csv');
  } else if (format === 'xlsx') {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TuVungMau');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    triggerDownload(blob, 'kotoba_dojo_mau_tu_vung.xlsx');
  } else if (format === 'json') {
    const jsonStr = JSON.stringify(sampleData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, 'kotoba_dojo_mau_tu_vung.json');
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

