'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  allKanjiVocabList,
  KANJI_TOPICS,
  getKanjiVocabFiltered,
} from '@/lib/kanji-data';
import { JLPTLevel } from '@/types';
import {
  BookOpen,
  Award,
  Zap,
  Gamepad2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

function KanjiStudyHubContent() {
  const searchParams = useSearchParams();

  const initialLevel = (searchParams.get('level') as JLPTLevel | 'ALL') || 'ALL';
  const initialTopic = searchParams.get('topic') || 'ALL';

  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | 'ALL'>(initialLevel);
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);

  // Cập nhật khi URL params thay đổi
  useEffect(() => {
    if (searchParams.get('level')) {
      setSelectedLevel(searchParams.get('level') as JLPTLevel | 'ALL');
    }
    if (searchParams.get('topic')) {
      setSelectedTopic(searchParams.get('topic') || 'ALL');
    }
  }, [searchParams]);

  // Lọc danh sách TỪ VỰNG CHỮ HÁN theo Level và Bài học
  const activeVocabList = useMemo(() => {
    return getKanjiVocabFiltered(selectedLevel, selectedTopic);
  }, [selectedLevel, selectedTopic]);

  // Danh sách bài học khả dụng theo level
  const availableTopics = useMemo(() => {
    if (selectedLevel === 'ALL') return KANJI_TOPICS;
    if (selectedLevel === 'N5') {
      return KANJI_TOPICS.filter(t => t.startsWith('JPD113'));
    }
    if (selectedLevel === 'N4') {
      return KANJI_TOPICS.filter(t => t.startsWith('JPD123'));
    }
    if (selectedLevel === 'N3') {
      return KANJI_TOPICS.filter(t => t.startsWith('JPD133'));
    }
    return KANJI_TOPICS;
  }, [selectedLevel]);

  // Đổi level thì reset topic nếu topic không thuộc level đó
  const handleLevelChange = (level: JLPTLevel | 'ALL') => {
    setSelectedLevel(level);
    if (level === 'ALL') {
      setSelectedTopic('ALL');
    } else {
      const prefix = level === 'N5' ? 'JPD113' : level === 'N4' ? 'JPD123' : 'JPD133';
      if (selectedTopic !== 'ALL' && !selectedTopic.startsWith(prefix)) {
        setSelectedTopic('ALL');
      }
    }
  };

  const countByLevel = useMemo(() => {
    return {
      ALL: allKanjiVocabList.length,
      N5: allKanjiVocabList.filter(k => k.level === 'N5').length,
      N4: allKanjiVocabList.filter(k => k.level === 'N4').length,
      N3: allKanjiVocabList.filter(k => k.level === 'N3').length,
    };
  }, []);

  const queryParams = `level=${selectedLevel}&topic=${encodeURIComponent(selectedTopic)}`;

  const modes = [
    {
      href: `/kanji/study/typing?${queryParams}`,
      title: 'Luyện Gõ Từ Vựng Chữ Hán',
      desc: 'Nhìn từ ghép chữ Hán (vd: 大学, 日本, 学校...), gõ cách đọc Hiragana bằng Romaji hoặc gõ âm Hán Việt.',
      icon: Zap,
      gradient: 'from-orange-500 via-amber-500 to-yellow-400',
      badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      tag: 'Phản xạ gõ từ vựng',
    },
    {
      href: `/kanji/study/flashcard?${queryParams}`,
      title: 'Flashcard Từ Vựng Chữ Hán',
      desc: 'Mặt trước là từ ghép chữ Hán to rõ, lật xem cách đọc Furigana, âm Hán Việt, nghĩa tiếng Việt và chi tiết từng chữ Hán.',
      icon: BookOpen,
      gradient: 'from-rose-500 via-pink-500 to-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      tag: 'Lật thẻ ghi nhớ từ',
    },
    {
      href: `/kanji/study/quiz?${queryParams}`,
      title: 'Trắc Nghiệm 4 Lựa Chọn',
      desc: 'Đa dạng 4 dạng câu hỏi: Từ chữ Hán → Cách đọc Hiragana, Nghĩa → Từ chữ Hán, Âm Hán Việt và nghĩa tiếng Việt.',
      icon: Award,
      gradient: 'from-blue-500 via-indigo-500 to-sky-400',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      tag: 'Nhận diện trắc nghiệm',
    },
    {
      href: `/kanji/study/match?${queryParams}`,
      title: 'Nối Cặp Ghép Từ Vựng',
      desc: 'Trò chơi tìm cặp từ chữ Hán và cách đọc kèm nghĩa tương ứng trên bàn cờ. Bấm giờ đếm giây thử thách tốc độ.',
      icon: Gamepad2,
      gradient: 'from-purple-500 via-violet-500 to-indigo-500',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      tag: 'Vui & Phấn khích',
    },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header Võ Đài Hán Tự */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-[2rem] bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/kanji"
              className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors"
              title="Quay lại danh bạ Hán tự"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Luyện Tập Từ Vựng Chữ Hán
              </h1>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-gradient-to-tr from-torii-500 to-rose-500 text-white shadow-sm shadow-torii-500/20">
                漢字単語
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2 font-medium">
            Luyện tập toàn bộ {allKanjiVocabList.length} từ vựng và từ ghép thực tế tạo thành từ 117 Hán tự chuẩn Manabiman
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-torii-500/10 border border-torii-500/30 text-torii-600 dark:text-torii-400 text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-torii-500 animate-ping" />
            <span>{activeVocabList.length} từ vựng sẵn sàng</span>
          </div>
        </div>
      </div>

      {/* Bộ Lọc Cấp Độ & Bài Học */}
      <div className="p-6 rounded-[2rem] bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        {/* Chọn Cấp Độ */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
            <Filter size={14} />
            <span>1. Chọn cấp độ:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              type="button"
              onClick={() => handleLevelChange('ALL')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
                selectedLevel === 'ALL'
                  ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
              }`}
            >
              Tất cả ({countByLevel.ALL} từ vựng)
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange('N5')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
                selectedLevel === 'N5'
                  ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
              }`}
            >
              N5 • JPD113 ({countByLevel.N5} từ vựng)
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange('N4')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
                selectedLevel === 'N4'
                  ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
              }`}
            >
              N4 • JPD123 ({countByLevel.N4} từ vựng)
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange('N3')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
                selectedLevel === 'N3'
                  ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/25'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
              }`}
            >
              N3 • JPD133 ({countByLevel.N3} từ vựng)
            </button>
          </div>
        </div>

        {/* Chọn Bài Học Cụ Thể */}
        <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-white/5">
          <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <GraduationCap size={14} />
              <span>2. Chọn bài học cụ thể (tùy chọn):</span>
            </div>
            {selectedTopic !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedTopic('ALL')}
                className="text-[11px] text-torii-500 hover:underline capitalize"
              >
                Chọn tất cả bài
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedTopic('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                selectedTopic === 'ALL'
                  ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900 shadow-sm'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
              }`}
            >
              Tất cả các bài trong cấp độ
            </button>
            {availableTopics.map(topic => {
              const isSelected = selectedTopic === topic;
              const count = allKanjiVocabList.filter(k => k.topic.includes(topic) || topic.includes(k.topic)).length;
              const shortTitle = topic.replace(/^JPD\d+\s*-\s*/, '');
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-torii-500 text-white shadow-sm shadow-torii-500/20'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
                  }`}
                >
                  {shortTitle} ({count} từ)
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid 4 Chế Độ Luyện Tập Từ Vựng Chữ Hán */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-torii-500" />
            <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
              3. Chọn chế độ luyện tập
            </h2>
          </div>
          <span className="text-xs text-stone-400">
            {activeVocabList.length} từ vựng được chọn
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map(mode => {
            const Icon = mode.icon;
            const disabled = activeVocabList.length === 0;

            return (
              <Link
                key={mode.href}
                href={disabled ? '#' : mode.href}
                className={`group relative p-6 sm:p-7 rounded-[2.2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'hover:border-torii-500/40 hover:shadow-xl hover:shadow-torii-500/10 hover:-translate-y-1 active:scale-[0.99]'
                }`}
              >
                {/* Glow accent */}
                <div
                  className={`absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-500 pointer-events-none`}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mode.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon size={24} className="stroke-[2.2]" />
                    </div>

                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${mode.badgeBg}`}
                    >
                      {mode.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 group-hover:text-torii-500 transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed font-medium">
                      {mode.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-stone-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-stone-400 group-hover:text-torii-500 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>{activeVocabList.length} từ vựng sẵn sàng</span>
                  </span>
                  <div className="flex items-center gap-1 font-black">
                    <span>Vào luyện</span>
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function KanjiStudyHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Đang tải phòng luyện tập từ vựng Hán tự...</div>}>
      <KanjiStudyHubContent />
    </Suspense>
  );
}
