'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import manabimanKanjiData from '@/data/manabiman-kanji.json';
import { allKanjiVocabList, getKanjiVocabFiltered, KanjiVocabItem } from '@/lib/kanji-data';
import { KanjiItem, JLPTLevel } from '@/types';
import { AudioButton } from '@/components/AudioButton';
import { Modal } from '@/components/Modal';
import {
  Search,
  Sparkles,
  BookOpen,
  Layers,
  Filter,
  ArrowRight,
  Award,
  Zap,
  Gamepad2,
  GraduationCap,
  Volume2,
} from 'lucide-react';

type LevelFilter = 'ALL' | 'N5' | 'N4' | 'N3';

export default function KanjiPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKanji, setActiveKanji] = useState<KanjiItem | null>(null);

  const kanjiList = manabimanKanjiData as KanjiItem[];

  // Danh sách chủ đề bài học
  const allTopics = useMemo(() => {
    return Array.from(new Set(kanjiList.map(k => k.topic).filter(Boolean))) as string[];
  }, [kanjiList]);

  const countByLevel = useMemo(() => {
    return {
      ALL: kanjiList.length,
      N5: kanjiList.filter(k => k.level === 'N5').length,
      N4: kanjiList.filter(k => k.level === 'N4').length,
      N3: kanjiList.filter(k => k.level === 'N3').length,
    };
  }, [kanjiList]);

  // Lọc Hán tự theo level, topic và tìm kiếm
  const filteredKanji = useMemo(() => {
    return kanjiList.filter(item => {
      if (selectedLevel !== 'ALL' && item.level !== selectedLevel) return false;
      if (selectedTopic !== 'ALL' && item.topic !== selectedTopic) return false;
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
  }, [kanjiList, selectedLevel, selectedTopic, searchQuery]);

  // Lọc Từ vựng Hán tự theo level, topic và tìm kiếm
  const filteredVocab = useMemo(() => {
    const list = getKanjiVocabFiltered(selectedLevel, selectedTopic);
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(v =>
      v.word.toLowerCase().includes(q) ||
      v.reading.toLowerCase().includes(q) ||
      v.meaningVi.toLowerCase().includes(q) ||
      (v.romaji && v.romaji.toLowerCase().includes(q)) ||
      (v.hanViet && v.hanViet.toLowerCase().includes(q))
    );
  }, [selectedLevel, selectedTopic, searchQuery]);

  // Giới hạn render lần đầu
  const [visibleCount, setVisibleCount] = useState(36);
  useEffect(() => {
    setVisibleCount(36);
  }, [selectedLevel, selectedTopic, searchQuery]);

  const displayedKanji = useMemo(() => {
    return filteredKanji.slice(0, visibleCount);
  }, [filteredKanji, visibleCount]);

  const practiceQueryParams = `level=${selectedLevel}&topic=${encodeURIComponent(selectedTopic)}`;

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header Hán Tự */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-[2rem] bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Hán Tự & Từ Vựng Chữ Hán
            </h1>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-gradient-to-tr from-torii-500 to-rose-500 text-white shadow-sm shadow-torii-500/20">
              漢字単語
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
            117 Hán tự và 311 từ vựng chữ Hán chuẩn giáo trình Manabiman (JPD113, JPD123, JPD133)
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative sm:w-80 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm chữ Hán, từ vựng, cách đọc, nghĩa..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-torii-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tabs Cấp độ JLPT */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setSelectedLevel('ALL');
            setSelectedTopic('ALL');
          }}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'ALL'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Tất cả (117 chữ • {allKanjiVocabList.length} từ)
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedLevel('N5');
            setSelectedTopic('ALL');
          }}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'N5'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Hán tự N5 • JPD113 ({countByLevel.N5} chữ)
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedLevel('N4');
            setSelectedTopic('ALL');
          }}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'N4'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Hán tự N4 • JPD123 ({countByLevel.N4} chữ)
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedLevel('N3');
            setSelectedTopic('ALL');
          }}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
            selectedLevel === 'N3'
              ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200/80 dark:border-white/[0.08]'
          }`}
        >
          Hán tự N3 • JPD133 ({countByLevel.N3} chữ)
        </button>
      </div>

      {/* Filter theo Bài học (Topic) */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <GraduationCap size={13} />
          Bài học:
        </span>
        <button
          type="button"
          onClick={() => setSelectedTopic('ALL')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
            selectedTopic === 'ALL'
              ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900 shadow-sm'
              : 'bg-stone-100 dark:bg-white/5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Tất cả bài
        </button>
        {allTopics.map(topic => {
          const isSelected = selectedTopic === topic;
          const shortTitle = topic.replace(/^JPD\d+\s*-\s*/, '');
          const vocabCount = allKanjiVocabList.filter(k => k.topic.includes(topic) || topic.includes(k.topic)).length;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-torii-500 text-white shadow-sm shadow-torii-500/20'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {shortTitle} ({vocabCount} từ)
            </button>
          );
        })}
      </div>

      {/* KHU VỰC TỪ VỰNG CHỮ HÁN THEO BÀI (MANABIMAN STYLE) */}
      <div className="p-6 sm:p-7 rounded-[2.2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                Từ Vựng Chữ Hán ({filteredVocab.length} từ)
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              Các từ vựng và từ ghép thực tế tạo thành từ các chữ Hán trong bài học
            </p>
          </div>

          {/* 4 Nút Luyện Tập Nổi Bật cho Bài Này */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/kanji/study/typing?${practiceQueryParams}`}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95 transition-all"
            >
              <Zap size={15} />
              <span>Luyện gõ ({filteredVocab.length} từ)</span>
            </Link>

            <Link
              href={`/kanji/study/flashcard?${practiceQueryParams}`}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 hover:border-rose-500 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <BookOpen size={14} />
              <span>Flashcard</span>
            </Link>

            <Link
              href={`/kanji/study/quiz?${practiceQueryParams}`}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 hover:border-blue-500 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Award size={14} />
              <span>Trắc nghiệm</span>
            </Link>

            <Link
              href={`/kanji/study/match?${practiceQueryParams}`}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 hover:border-purple-500 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Gamepad2 size={14} />
              <span>Ghép thẻ</span>
            </Link>
          </div>
        </div>

        {/* Danh Sách Chip Từ Vựng Hán Tự Chuẩn Manabiman */}
        {filteredVocab.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {filteredVocab.map(item => (
              <div
                key={item.id}
                className="group relative flex items-center gap-2 rounded-2xl bg-stone-50 dark:bg-white/[0.04] hover:bg-orange-500/10 dark:hover:bg-orange-500/15 border border-stone-200/70 dark:border-white/5 hover:border-orange-500/30 py-2 px-3.5 transition-all duration-200 shadow-sm"
              >
                <div className="min-w-0">
                  <span className="font-jp block text-base font-black text-stone-900 dark:text-stone-100 group-hover:text-orange-500 transition-colors leading-tight">
                    {item.word}
                  </span>
                  <span className="font-jp block text-[11px] text-torii-500 font-bold leading-tight">
                    {item.reading}
                  </span>
                  <span className="block text-xs text-stone-500 dark:text-stone-400 truncate max-w-[190px] font-medium leading-snug">
                    {item.meaningVi}
                  </span>
                </div>

                <div className="flex shrink-0 items-center pl-1">
                  <AudioButton text={item.word} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">Không có từ vựng phù hợp với tìm kiếm.</p>
        )}
      </div>

      {/* DANH SÁCH BẢNG CHỮ HÁN ĐƠN LẺ ĐỂ TRA CỨU */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-torii-500" />
            <span className="text-sm font-black text-stone-800 dark:text-stone-200">
              Bảng Chữ Hán Tượng Hình ({filteredKanji.length} chữ)
            </span>
          </div>
          <span>Bấm vào chữ Hán để xem số nét, âm On/Kun và câu chuyện gợi nhớ</span>
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
                  <div className="flex items-center justify-between w-full text-[10px] font-bold text-stone-400 dark:text-stone-500">
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 font-mono">
                      {item.strokes} nét
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-torii-500/10 text-torii-600 dark:text-torii-400 font-bold border border-torii-500/20">
                      {item.level}
                    </span>
                  </div>

                  <div className="font-jp text-5xl font-black text-stone-900 dark:text-stone-100 group-hover:text-torii-500 transition-colors my-2 drop-shadow-sm">
                    {item.kanji}
                  </div>

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
              Thử nhập từ khóa tìm kiếm khác hoặc chuyển bộ lọc cấp độ JLPT / bài học.
            </p>
          </div>
        )}
      </div>

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

            {/* Nút Chuyển Vào Luyện Gõ Từ Vựng */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200/60 dark:border-white/5">
              <Link
                href={`/kanji/study/typing?level=${activeKanji.level}&topic=${encodeURIComponent(activeKanji.topic || 'ALL')}`}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <Zap size={14} />
                <span>Luyện gõ từ vựng bài này</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
