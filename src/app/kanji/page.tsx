'use client';

import React, { useState, useMemo, useEffect } from 'react';
import manabimanKanjiData from '@/data/manabiman-kanji.json';
import { KanjiItem, JLPTLevel } from '@/types';
import { AudioButton } from '@/components/AudioButton';
import { Modal } from '@/components/Modal';
import { Search, Sparkles, BookOpen, Layers, Filter, ArrowRight } from 'lucide-react';

type LevelFilter = 'ALL' | 'N5' | 'N4' | 'N3';

export default function KanjiPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKanji, setActiveKanji] = useState<KanjiItem | null>(null);

  const kanjiList = manabimanKanjiData as KanjiItem[];

  const countByLevel = useMemo(() => {
    return {
      ALL: kanjiList.length,
      N5: kanjiList.filter(k => k.level === 'N5').length,
      N4: kanjiList.filter(k => k.level === 'N4').length,
      N3: kanjiList.filter(k => k.level === 'N3').length,
    };
  }, [kanjiList]);

  const filteredKanji = useMemo(() => {
    return kanjiList.filter(item => {
      // Level filter
      if (selectedLevel !== 'ALL' && item.level !== selectedLevel) {
        return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.kanji.includes(q) ||
        item.hanViet.toLowerCase().includes(q) ||
        item.meaningVi.toLowerCase().includes(q) ||
        (item.topic && item.topic.toLowerCase().includes(q)) ||
        item.on.some(o => o.toLowerCase().includes(q)) ||
        item.kun.some(k => k.toLowerCase().includes(q))
      );
    });
  }, [kanjiList, selectedLevel, searchQuery]);

  // Giới hạn số chữ Hán render lần đầu để chuyển trang tức thì
  const [visibleCount, setVisibleCount] = useState(36);
  useEffect(() => {
    setVisibleCount(36);
  }, [selectedLevel, searchQuery]);

  const displayedKanji = useMemo(() => {
    return filteredKanji.slice(0, visibleCount);
  }, [filteredKanji, visibleCount]);

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header Hán Tự */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-[2rem] bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Tra Cứu & Học Hán Tự (Kanji)
            </h1>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-gradient-to-tr from-torii-500 to-rose-500 text-white shadow-sm shadow-torii-500/20">
              漢字
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
            Toàn bộ 117 Hán tự chuẩn giáo trình JPD113, JPD123, JPD133 kèm âm On, Kun, âm Hán Việt và câu chuyện tượng hình
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative sm:w-80 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm chữ Hán, Hán Việt, nghĩa..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-torii-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tabs Cấp độ JLPT */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedLevel('ALL')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'ALL'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Tất cả ({countByLevel.ALL})
        </button>
        <button
          type="button"
          onClick={() => setSelectedLevel('N5')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'N5'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Hán tự N5 • JPD113 ({countByLevel.N5})
        </button>
        <button
          type="button"
          onClick={() => setSelectedLevel('N4')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'N4'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Hán tự N4 • JPD123 ({countByLevel.N4})
        </button>
        <button
          type="button"
          onClick={() => setSelectedLevel('N3')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'N3'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Hán tự N3 • JPD133 ({countByLevel.N3})
        </button>
      </div>

      {/* Grid danh sách Hán tự */}
      {filteredKanji.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {displayedKanji.map(item => (
              <div
                key={item.id}
                onClick={() => setActiveKanji(item)}
                className="p-4 sm:p-5 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] hover:border-torii-400/60 dark:hover:border-torii-500/50 hover:shadow-xl hover:shadow-torii-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between min-h-[185px] group select-none active:scale-95 shadow-sm"
              >
                {/* Badge Cấp & Nét */}
                <div className="flex items-center justify-between w-full text-[10px] font-bold text-stone-400 dark:text-stone-500">
                  <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 font-mono">
                    {item.strokes} nét
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-torii-500/10 text-torii-600 dark:text-torii-400 font-bold border border-torii-500/20">
                    {item.level}
                  </span>
                </div>

                {/* Chữ Hán to */}
                <div className="font-jp text-5xl font-black text-stone-900 dark:text-stone-100 group-hover:text-torii-500 transition-colors my-2 drop-shadow-sm">
                  {item.kanji}
                </div>

                {/* Âm Hán Việt & Nghĩa */}
                <div className="text-center w-full">
                  <p className="font-black text-xs uppercase tracking-wider text-torii-600 dark:text-torii-400 truncate">
                    {item.hanViet}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5 font-medium">
                    {item.meaningVi}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredKanji.length > visibleCount && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount(c => c + 36)}
                className="px-7 py-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08] hover:bg-stone-50 dark:hover:bg-white/5 text-stone-700 dark:text-stone-300 font-extrabold text-xs shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                Xem thêm ({filteredKanji.length - visibleCount} chữ nữa)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-3 shadow-sm">
          <BookOpen size={40} className="mx-auto text-stone-300 dark:text-stone-600" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
            Không tìm thấy Hán tự phù hợp
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Thử nhập từ khóa tìm kiếm khác hoặc chuyển bộ lọc cấp độ JLPT.
          </p>
        </div>
      )}

      {/* Modal Chi Tiết Hán Tự */}
      <Modal
        isOpen={Boolean(activeKanji)}
        onClose={() => setActiveKanji(null)}
        maxWidth="lg"
      >
        {activeKanji && (
          <div className="space-y-6">
            {/* Header Kanji */}
            <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-torii-500/10 dark:bg-torii-500/15 border border-torii-500/20">
              <div className="w-22 h-22 rounded-3xl bg-white dark:bg-[#0c1017] shadow-md flex items-center justify-center font-jp text-6xl font-black text-torii-600 dark:text-torii-400 shrink-0 border border-torii-500/20">
                {activeKanji.kanji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                    {activeKanji.hanViet}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-torii-500 text-white shadow-sm">
                    {activeKanji.level}
                  </span>
                </div>
                <p className="text-sm font-bold text-stone-600 dark:text-stone-300 mt-1">
                  {activeKanji.meaningVi}
                </p>
                <div className="flex items-center gap-3 text-xs text-stone-400 mt-1.5 font-medium">
                  <span>Số nét: <strong className="text-stone-700 dark:text-stone-300">{activeKanji.strokes} nét</strong></span>
                  {activeKanji.topic && (
                    <>
                      <span>•</span>
                      <span className="truncate">{activeKanji.topic}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Âm On & Âm Kun */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/80 dark:border-white/5">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Âm ON (Katakana)
                </span>
                <p className="font-jp font-bold text-sm text-stone-800 dark:text-stone-200">
                  {activeKanji.on.join(', ') || '—'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/80 dark:border-white/5">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Âm KUN (Hiragana)
                </span>
                <p className="font-jp font-bold text-sm text-stone-800 dark:text-stone-200">
                  {activeKanji.kun.join(', ') || '—'}
                </p>
              </div>
            </div>

            {/* Gợi nhớ bằng hình ảnh & Câu chuyện */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Sparkles size={15} />
                <span>Câu chuyện gợi nhớ tượng hình</span>
              </div>
              <div className="flex items-start gap-3.5">
                <span className="text-3xl p-2 rounded-2xl bg-white dark:bg-stone-800 shadow-sm shrink-0 border border-amber-500/20">
                  {activeKanji.mnemonicEmoji}
                </span>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                  {activeKanji.mnemonicNoteVi}
                </p>
              </div>
            </div>

            {/* Từ vựng ví dụ thực tế */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Từ ghép thông dụng trong giáo trình:
              </span>
              <div className="space-y-2">
                {activeKanji.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5"
                  >
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-jp font-bold text-base text-stone-900 dark:text-stone-100">
                        {ex.word}
                      </span>
                      <span className="text-xs text-torii-600 dark:text-torii-400 font-jp font-bold">
                        [{ex.reading}]
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        : {ex.meaning}
                      </span>
                    </div>
                    <AudioButton text={ex.word} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
