'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Flame,
  Award,
  BookOpen,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Gamepad2,
  Clock,
  CheckCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { decks, words, stats, activeDeckIds, toggleActiveDeck } = useApp();

  // Thống kê nhanh
  const totalWords = words.length;
  const masteredWords = words.filter(w => w.isMastered).length;

  // Tỉ lệ đúng hôm nay
  const today = new Date().toISOString().split('T')[0];
  const todayStats = stats.history[today] || { total: 0, correct: 0 };
  const todayAccuracy =
    todayStats.total > 0
      ? Math.round((todayStats.correct / todayStats.total) * 100)
      : 100;

  // Thống kê theo cấp độ JLPT
  const jlptLevels: ('N5' | 'N4' | 'N3' | 'N2' | 'N1')[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const jlptStats = useMemo(() => {
    return jlptLevels.map(lvl => {
      const lvlWords = words.filter(w => w.level === lvl);
      const lvlMastered = lvlWords.filter(w => w.isMastered).length;
      return {
        level: lvl,
        total: lvlWords.length,
        mastered: lvlMastered,
        percent: lvlWords.length > 0 ? Math.round((lvlMastered / lvlWords.length) * 100) : 0,
      };
    });
  }, [words]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner Chào Mừng & Động Lực Siêu Đẹp */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-torii-600 via-rose-600 to-amber-600 p-6 sm:p-8 md:p-10 text-white shadow-2xl shadow-torii-600/25 border border-white/20">
        {/* Họa tiết ánh sáng & gradient phủ */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/25 via-transparent to-black/30 pointer-events-none" />
        
        {/* Chữ Hán trang trí nền mờ ảo kiểu Thư Pháp Nhật */}
        <div className="absolute -right-6 -bottom-12 select-none text-[200px] md:text-[240px] font-black text-white/10 pointer-events-none font-serif leading-none tracking-tighter">
          道
        </div>
        <div className="absolute right-36 -top-10 select-none text-[120px] font-black text-white/[0.04] pointer-events-none font-serif leading-none">
          武
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/25 shadow-sm">
            <Sparkles size={14} className="text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="tracking-wide">KOTOBA DOJO • CÔNG NGHỆ NHỚ SM-2 & BỘ GÕ WANAKANA</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] drop-shadow-sm">
            Rèn luyện mỗi ngày, <br />
            <span className="text-amber-200">chinh phục tiếng Nhật</span> vững vàng!
          </h1>

          <p className="text-white/90 text-sm md:text-base leading-relaxed font-medium max-w-xl">
            Lộ trình học từ vựng chuẩn Manabiman với 6 chế độ võ đài rèn luyện, tự động chuyển đổi Romaji sang Kana và thuật toán lặp lại ngắt quãng thông minh.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/study/flashcard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-stone-900 font-extrabold text-sm shadow-xl hover:bg-stone-50 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group"
            >
              <Zap size={18} className="fill-torii-500 text-torii-500 group-hover:animate-bounce" />
              <span>Bắt đầu ôn luyện ngay</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/vocabulary"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-black/20 hover:bg-black/30 backdrop-blur-md font-bold text-sm text-white border border-white/20 transition-all active:scale-95 shadow-sm"
            >
              <FileText size={16} />
              <span>Quản lý kho từ vựng</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Thẻ Chỉ Số Trực Quan Siêu Sang Trọng */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Chuỗi ngày */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/70 dark:border-white/[0.08] shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25 group-hover:scale-110 transition-transform">
            <Flame size={24} className="fill-white animate-bounce" />
          </div>
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Chuỗi kỷ lục</p>
            <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {stats.streak} <span className="text-xs font-semibold text-stone-400">ngày</span>
            </p>
          </div>
        </div>

        {/* Từ đã thuộc */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/70 dark:border-white/[0.08] shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-transform">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Đã thuộc vững</p>
            <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {masteredWords} <span className="text-xs font-semibold text-stone-400">/ {totalWords}</span>
            </p>
          </div>
        </div>

        {/* Tỉ lệ đúng hôm nay */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/70 dark:border-white/[0.08] shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Độ chính xác</p>
            <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {todayAccuracy}%
            </p>
          </div>
        </div>

        {/* Tổng số từ */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/70 dark:border-white/[0.08] shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-torii-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-torii-500/25 group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Kho từ vựng</p>
            <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {totalWords} <span className="text-xs font-semibold text-stone-400">từ</span>
            </p>
          </div>
        </div>
      </section>

      {/* Lối Tắt Các Chế Độ Học Tập Cực Đỉnh */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center font-bold">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Võ Đài Rèn Luyện (Dojo)
              </h2>
            </div>
          </div>
          <Link
            href="/study"
            className="text-xs font-bold text-torii-600 dark:text-torii-400 hover:text-torii-700 flex items-center gap-1 group"
          >
            <span>Tất cả chế độ</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Luyện gõ phản xạ */}
          <Link
            href="/study/typing"
            className="p-4 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08] hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center mb-3 shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-orange-500 transition-colors">
                Gõ phản xạ
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Tốc độ & WanaKana</p>
            </div>
          </Link>

          {/* 2. Flashcard lật thẻ */}
          <Link
            href="/study/flashcard"
            className="p-4 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08] hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center mb-3 shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-rose-500 transition-colors">
                Flashcard
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Lật thẻ 3D, nhớ sâu</p>
            </div>
          </Link>

          {/* 3. Trắc nghiệm */}
          <Link
            href="/study/quiz"
            className="p-4 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-blue-500 transition-colors">
                Trắc nghiệm
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Tự sinh đáp án nhiễu</p>
            </div>
          </Link>

          {/* 4. Gõ đáp án */}
          <Link
            href="/study/write"
            className="p-4 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08] hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-emerald-500 transition-colors">
                Gõ đáp án
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Chính xác 100%</p>
            </div>
          </Link>

          {/* 5. Nối cặp */}
          <Link
            href="/study/match"
            className="p-4 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08] hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-violet-500 text-white flex items-center justify-center mb-3 shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Gamepad2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-purple-500 transition-colors">
                Nối cặp
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Bàn cờ phản xạ</p>
            </div>
          </Link>

          {/* 6. Thi thử */}
          <Link
            href="/study/test"
            className="p-4 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08] hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-500 transition-colors">
                Thi thử
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Bấm giờ & Tổng kết</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Tiến độ Cấp Độ JLPT & Các Bộ Từ Vựng */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Tiến độ JLPT */}
        <section className="lg:col-span-2 p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-2.5 text-base sm:text-lg">
              <div className="w-7 h-7 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <span>Tiến độ theo Cấp độ JLPT (N5 - N1)</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/5 text-stone-400">
              Thuật toán SM-2
            </span>
          </div>

          <div className="space-y-4">
            {jlptStats.map(item => (
              <div key={item.level} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-8 py-0.5 text-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-[11px]">
                      {item.level}
                    </span>
                    <span className="text-stone-600 dark:text-stone-300">
                      Cấp độ {item.level}
                    </span>
                  </div>
                  <span className="text-stone-400 font-mono text-[11px]">
                    {item.mastered} / {item.total} từ ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-white/5 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-torii-500 via-rose-500 to-amber-500 rounded-full transition-all duration-500 shadow-sm shadow-torii-500/30"
                    style={{ width: `${Math.max(item.percent, item.total > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cột 3: Bộ từ đang kích hoạt để ôn tập */}
        <section className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 text-base">
                <div className="w-7 h-7 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <span>Bộ từ đang chọn ({activeDeckIds.length})</span>
              </h2>
              <Link href="/vocabulary" className="text-xs font-bold text-torii-500 hover:text-torii-600">
                Quản lý
              </Link>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {decks.map(deck => {
                const deckWordCount = words.filter(w => w.deckId === deck.id).length;
                const isSelected = activeDeckIds.includes(deck.id);

                return (
                  <div
                    key={deck.id}
                    onClick={() => toggleActiveDeck(deck.id)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'border-torii-500/80 bg-torii-500/5 dark:bg-torii-500/10 shadow-sm'
                        : 'border-stone-200/70 dark:border-white/[0.06] hover:bg-stone-50/80 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className={`font-bold text-xs sm:text-sm truncate ${
                        isSelected ? 'text-torii-600 dark:text-torii-400' : 'text-stone-900 dark:text-stone-100'
                      }`}>
                        {deck.title}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                        {deckWordCount} từ • Cấp {deck.level || 'N5'}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-torii-500 border-torii-500 text-white'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}>
                      {isSelected && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/vocabulary"
            className="w-full py-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-torii-500 text-stone-500 hover:text-torii-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-torii-500/5 active:scale-98"
          >
            + Thêm bộ từ vựng mới hoặc nạp Excel
          </Link>
        </section>
      </div>
    </div>
  );
}
