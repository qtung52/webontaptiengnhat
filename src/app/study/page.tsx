'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Zap,
  BookOpen,
  Award,
  CheckCircle,
  Gamepad2,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export default function StudyHubPage() {
  const {
    decks,
    words,
    activeDeckIds,
    toggleActiveDeck,
    activeTopics,
    toggleActiveTopic,
    selectAllTopics,
    studyWords,
  } = useApp();

  // Danh sách từ vựng thuộc các bộ giáo trình đang kích hoạt
  const activeDeckWords = useMemo(() => {
    return words.filter(w => activeDeckIds.includes(w.deckId));
  }, [words, activeDeckIds]);

  // Danh sách tất cả chủ đề có trong các giáo trình đang kích hoạt
  const availableTopics = useMemo(() => {
    const map = new Map<string, number>();
    activeDeckWords.forEach(w => {
      if (w.topic) {
        map.set(w.topic, (map.get(w.topic) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [activeDeckWords]);

  const [topicSearch, setTopicSearch] = useState('');
  const [isTopicExpanded, setIsTopicExpanded] = useState(true);

  // Lọc chủ đề theo từ khóa tìm kiếm
  const filteredAvailableTopics = useMemo(() => {
    if (!topicSearch.trim()) return availableTopics;
    const q = topicSearch.toLowerCase().trim();
    return availableTopics.filter(t => t.topic.toLowerCase().includes(q));
  }, [availableTopics, topicSearch]);

  const isAllTopicsSelected = activeTopics.includes('ALL');

  const modes = [
    {
      href: '/study/typing',
      title: 'Luyện Gõ Phản Xạ',
      desc: 'Hiện nghĩa tiếng Việt, gõ nhanh bằng Romaji tự chuyển Kana (WanaKana). Có đồng hồ tốc độ và tính điểm chuẩn.',
      icon: Zap,
      gradient: 'from-orange-500 via-amber-500 to-yellow-400',
      shadow: 'hover:shadow-orange-500/20 hover:border-orange-500/40',
      badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      tag: 'Phản xạ & IME',
    },
    {
      href: '/study/flashcard',
      title: 'Flashcard Lật Thẻ',
      desc: 'Hiệu ứng lật 3D mượt mà. Nhấn phím Cách để lật mặt sau, phím Mũi tên để chuyển thẻ, đánh dấu thuộc/chưa thuộc.',
      icon: BookOpen,
      gradient: 'from-rose-500 via-pink-500 to-rose-400',
      shadow: 'hover:shadow-rose-500/20 hover:border-rose-500/40',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      tag: 'Ghi nhớ nhanh',
    },
    {
      href: '/study/quiz',
      title: 'Trắc Nghiệm 4 Lựa Chọn',
      desc: 'Hệ thống tự động sinh 3 đáp án nhiễu từ kho từ vựng. Đa dạng chiều hỏi: Nhật → Việt, Việt → Nhật, Đọc → Kanji.',
      icon: Award,
      gradient: 'from-blue-500 via-indigo-500 to-sky-400',
      shadow: 'hover:shadow-blue-500/20 hover:border-blue-500/40',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      tag: 'Nhận diện nhanh',
    },
    {
      href: '/study/write',
      title: 'Gõ Đáp Án & Điền Từ',
      desc: 'Nhập cách đọc Hiragana/Katakana hoặc nghĩa tiếng Việt. Tự động kiểm tra chính tả và âm vần thông minh.',
      icon: CheckCircle,
      gradient: 'from-emerald-500 via-teal-500 to-emerald-400',
      shadow: 'hover:shadow-emerald-500/20 hover:border-emerald-500/40',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      tag: 'Chính xác 100%',
    },
    {
      href: '/study/match',
      title: 'Nối Cặp (Matching Game)',
      desc: 'Trò chơi tìm cặp từ tiếng Nhật và nghĩa tiếng Việt tương ứng trên bàn cờ. Bấm giờ thử thách sự nhanh nhạy.',
      icon: Gamepad2,
      gradient: 'from-purple-500 via-violet-500 to-indigo-500',
      shadow: 'hover:shadow-purple-500/20 hover:border-purple-500/40',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      tag: 'Vui & Phấn khích',
    },
    {
      href: '/study/test',
      title: 'Thi Thử Tính Giờ',
      desc: 'Tùy chọn số lượng câu, giới hạn thời gian làm bài, bảng điểm tổng kết và xem lại chi tiết từng câu sai.',
      icon: Clock,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      shadow: 'hover:shadow-amber-500/20 hover:border-amber-500/40',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      tag: 'Mô phỏng thi thật',
    },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header Võ Đài */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 sm:p-7 rounded-[2rem] bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Võ Đài Rèn Luyện (Dojo)
            </h1>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-gradient-to-tr from-torii-500 to-rose-500 text-white shadow-sm shadow-torii-500/20">
              練習
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
            Chọn bộ giáo trình và tùy chỉnh các chủ đề bài học để tạo phòng ôn tập chuyên sâu
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{studyWords.length} từ sẵn sàng ôn</span>
          </div>
        </div>
      </div>

      {/* 1. Chọn Bộ Giáo Trình (Deck) */}
      <div className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                1. Chọn bộ giáo trình học
              </h2>
              <p className="text-[11px] text-stone-400 font-medium">
                {activeDeckWords.length} từ vựng khả dụng trong các giáo trình đã chọn
              </p>
            </div>
          </div>
          <Link
            href="/vocabulary"
            className="text-xs font-bold text-torii-600 dark:text-torii-400 hover:text-torii-700 hover:underline"
          >
            Quản lý bộ từ →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {decks.map(deck => {
            const count = words.filter(w => w.deckId === deck.id).length;
            const isSelected = activeDeckIds.includes(deck.id);
            return (
              <button
                key={deck.id}
                type="button"
                onClick={() => toggleActiveDeck(deck.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2.5 border active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white border-transparent shadow-md shadow-torii-500/25 scale-102'
                    : 'bg-stone-50 dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-white/[0.08] hover:bg-stone-100 dark:hover:bg-white/[0.08]'
                }`}
              >
                <span>{deck.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    isSelected
                      ? 'bg-black/20 text-white'
                      : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {count} từ
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TÙY CHỌN CHỦ ĐỀ / BÀI HỌC ĐỂ ÔN TẬP */}
      <div className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center font-bold">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                2. Tùy chọn chủ đề / bài học cần ôn
              </h2>
              <p className="text-[11px] text-stone-400 font-medium">
                {isAllTopicsSelected
                  ? `Đang ôn toàn bộ ${availableTopics.length} bài học`
                  : `Đang chọn lọc ${activeTopics.length} / ${availableTopics.length} bài học`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllTopics}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                isAllTopicsSelected
                  ? 'bg-torii-500 border-torii-500 text-white shadow-sm shadow-torii-500/20'
                  : 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:text-torii-500'
              }`}
            >
              Ôn tất cả bài học
            </button>

            <button
              type="button"
              onClick={() => setIsTopicExpanded(!isTopicExpanded)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-800"
              title={isTopicExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isTopicExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {isTopicExpanded && (
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Thanh tìm kiếm nhanh bài học */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={topicSearch}
                onChange={e => setTopicSearch(e.target.value)}
                placeholder="Tìm nhanh bài học (vd: Bài 1, Động từ, Thể Te, Ăn uống...)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-torii-500 focus:border-torii-500 shadow-inner"
              />
            </div>

            {/* Danh sách các chủ đề (chips) */}
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredAvailableTopics.map(({ topic, count }) => {
                const isSelected = !isAllTopicsSelected && activeTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleActiveTopic(topic)}
                    className={`px-3 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 border text-left active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white border-transparent shadow-sm shadow-torii-500/25 font-bold'
                        : isAllTopicsSelected
                        ? 'bg-stone-50/80 dark:bg-white/[0.03] text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-white/[0.08] hover:border-torii-400'
                        : 'bg-stone-50/50 dark:bg-white/[0.02] text-stone-400 dark:text-stone-500 border-stone-200/50 dark:border-white/[0.05] hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    {isSelected && <Check size={13} className="shrink-0 stroke-[3]" />}
                    <span className="truncate max-w-[280px]">{topic}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                        isSelected
                          ? 'bg-black/20 text-white font-bold'
                          : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              {filteredAvailableTopics.length === 0 && (
                <div className="text-xs text-stone-400 py-4 w-full text-center">
                  Không tìm thấy bài học nào phù hợp với từ khóa &quot;{topicSearch}&quot;.
                </div>
              )}
            </div>

            {/* Chú thích & Lối tắt chọn lại tất cả */}
            <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-100 dark:border-white/5">
              <span className="font-medium">
                {isAllTopicsSelected
                  ? `Đang ôn toàn bộ (${studyWords.length} từ)`
                  : `Đã chọn ${activeTopics.length} bài (${studyWords.length} từ khả dụng)`}
              </span>
              {!isAllTopicsSelected && (
                <button
                  type="button"
                  onClick={selectAllTopics}
                  className="text-torii-600 dark:text-torii-400 font-bold hover:underline"
                >
                  Chọn lại tất cả bài học
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Danh Sách 6 Chế Độ Học Tập Cực Đỉnh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {modes.map(mode => {
          const Icon = mode.icon;
          return (
            <Link
              key={mode.href}
              href={mode.href}
              className={`p-6 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] ${mode.shadow} hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between shadow-sm`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-13 h-13 p-3 rounded-2xl bg-gradient-to-tr ${mode.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border ${mode.badgeBg}`}
                  >
                    {mode.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 group-hover:text-torii-500 transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mt-1.5 font-medium">
                    {mode.desc}
                  </p>
                </div>
              </div>

              <div className="pt-5 flex items-center text-xs font-bold text-torii-600 dark:text-torii-400 group-hover:translate-x-1.5 transition-transform duration-200">
                <span>Vào luyện tập ngay</span>
                <ArrowRight size={14} className="ml-1.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
