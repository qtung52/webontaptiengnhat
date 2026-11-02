'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { VocabWord } from '@/types';
import { AudioButton } from '@/components/AudioButton';
import { playChime } from '@/lib/sound';
import {
  RotateCcw,
  Check,
  X,
  Volume2,
  Layers,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FlashcardPage() {
  const { studyWords, updateWordSRS, recordStudyResult } = useApp();

  const filteredWords = studyWords;

  const [deckWords, setDeckWords] = useState<VocabWord[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (filteredWords.length > 0 && !initializedRef.current) {
      setDeckWords([...filteredWords].sort(() => Math.random() - 0.5));
      initializedRef.current = true;
    }
  }, [filteredWords]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [learningIds, setLearningIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentWord: VocabWord | undefined = deckWords[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
    playChime('click');
  }, []);

  const handleNext = useCallback(
    (know: boolean) => {
      if (!currentWord) return;

      if (know) {
        playChime('correct');
        setMasteredIds(prev => (prev.includes(currentWord.id) ? prev : [...prev, currentWord.id]));
        updateWordSRS(currentWord.id, 5); // SM-2 hoàn hảo
      } else {
        playChime('wrong');
        setLearningIds(prev => (prev.includes(currentWord.id) ? prev : [...prev, currentWord.id]));
        updateWordSRS(currentWord.id, 2); // SM-2 cần ôn lại
      }

      setIsFlipped(false);

      if (currentIndex + 1 < deckWords.length) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 150);
      } else {
        // Hoàn tất bộ thẻ
        setIsCompleted(true);
        playChime('complete');
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
        recordStudyResult(masteredIds.length + (know ? 1 : 0), deckWords.length);
      }
    },
    [currentWord, currentIndex, deckWords.length, masteredIds.length, recordStudyResult, updateWordSRS]
  );

  // Phím tắt bàn phím: Space (lật), ArrowLeft (chưa thuộc), ArrowRight (đã thuộc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleNext(true);
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleNext(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext]);

  if (deckWords.length === 0) {
    return (
      <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4 max-w-md mx-auto shadow-xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">Chưa có từ vựng nào!</h2>
        <p className="text-xs text-stone-500 font-medium">
          Hãy kích hoạt ít nhất một bộ giáo trình có từ vựng ở trang Võ Đài để bắt đầu ôn Flashcard.
        </p>
        <Link
          href="/study"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-torii-500 hover:bg-torii-600 text-white font-bold text-xs shadow-md shadow-torii-500/25 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Về trang Võ Đài chọn bài</span>
        </Link>
      </div>
    );
  }

  // Màn hình hoàn thành
  if (isCompleted) {
    return (
      <div className="max-w-md mx-auto p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
          <Award size={40} />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            Xuất Sắc! Hoàn Thành!
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 font-medium">
            Bạn đã hoàn thành phiên ôn tập {deckWords.length} thẻ từ vựng
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
              Đã thuộc
            </span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-300 font-mono">
              {masteredIds.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
              Cần rèn thêm
            </span>
            <span className="text-3xl font-black text-amber-600 dark:text-amber-300 font-mono">
              {learningIds.length}
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDeckWords([...filteredWords].sort(() => Math.random() - 0.5));
              setCurrentIndex(0);
              setIsFlipped(false);
              setMasteredIds([]);
              setLearningIds([]);
              setIsCompleted(false);
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-lg shadow-torii-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Ôn lại từ đầu</span>
          </button>

          <Link
            href="/study"
            className="px-5 py-3.5 rounded-2xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 font-bold text-sm transition-all"
          >
            Võ Đài
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / deckWords.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Nút Quay Về & Tiêu đề chế độ */}
      <div className="flex items-center justify-between">
        <Link
          href="/study"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 hover:text-torii-600 dark:hover:text-torii-400 hover:border-torii-400 text-xs font-bold transition-all shadow-sm active:scale-95 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Quay về Võ Đài</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400">
          <BookOpen size={14} className="text-torii-500" />
          <span>Flashcard Lật Thẻ</span>
        </div>
      </div>

      {/* Top Bar Tiến Độ & Bộ Từ */}
      <div className="space-y-2 p-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-stone-600 dark:text-stone-300">
            Thẻ #{currentIndex + 1} / {deckWords.length}
          </span>
          <span className="text-torii-600 dark:text-torii-400 font-mono">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-white/5 overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-torii-500 via-rose-500 to-amber-500 rounded-full transition-all duration-300 shadow-sm shadow-torii-500/30"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Thẻ Flashcard 3D Lật Mặt Tuyệt Mỹ */}
      <div
        className="w-full h-84 sm:h-96 perspective-1000 cursor-pointer select-none group"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* MẶT TRƯỚC (Front: Tiếng Nhật) */}
          <div className="absolute inset-0 backface-hidden rounded-[2.5rem] p-7 sm:p-9 bg-white/90 dark:bg-[#0c1017]/95 backdrop-blur-2xl border-2 border-stone-200/90 dark:border-white/[0.12] shadow-2xl flex flex-col justify-between items-center text-center group-hover:border-torii-400/50 transition-colors">
            {/* Họa tiết ánh sáng chìm */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-torii-500/[0.04] via-transparent to-transparent pointer-events-none" />

            <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/10">
                {currentWord.level || 'N5'}
              </span>
              <AudioButton text={currentWord.japanese} size="md" />
            </div>

            <div className="my-auto relative z-10 space-y-2">
              <div className="font-jp text-5xl sm:text-6xl md:text-7xl font-black text-stone-900 dark:text-stone-100 tracking-tight drop-shadow-sm">
                {currentWord.japanese}
              </div>
              <p className="text-xs text-stone-400 font-medium flex items-center justify-center gap-1.5 pt-2">
                <span>Chạm thẻ hoặc nhấn</span>
                <kbd>Space</kbd>
                <span>để lật xem nghĩa</span>
              </p>
            </div>

            <div className="text-[11px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider relative z-10">
              Kotoba Dojo Flashcard
            </div>
          </div>

          {/* MẶT SAU (Back: Cách đọc, Hán Việt, Nghĩa, Ví dụ) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2.5rem] p-7 sm:p-9 bg-gradient-to-b from-torii-500/[0.06] to-rose-500/[0.03] dark:from-[#0c1017]/98 dark:to-[#121622]/98 backdrop-blur-2xl border-2 border-torii-400/60 dark:border-torii-500/40 shadow-2xl flex flex-col justify-between items-center text-center">
            <div className="flex items-center justify-between w-full relative z-10">
              <span className="text-xs font-bold text-torii-600 dark:text-torii-400 uppercase tracking-widest px-3 py-1 rounded-full bg-torii-500/10 border border-torii-500/20">
                {currentWord.hanViet ? `Âm Hán: ${currentWord.hanViet}` : 'Mặt sau'}
              </span>
              <AudioButton text={currentWord.reading} size="md" />
            </div>

            <div className="my-auto space-y-3.5 relative z-10">
              <div className="font-jp text-3xl sm:text-4xl font-black text-torii-600 dark:text-torii-400">
                {currentWord.reading}
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {currentWord.meaningVi}
              </div>

              {currentWord.example && (
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/10 text-xs text-stone-600 dark:text-stone-300 font-medium max-w-sm mx-auto shadow-sm">
                  💡 {currentWord.example}
                </div>
              )}
            </div>

            <div className="text-[11px] text-stone-400 font-medium flex items-center justify-center gap-2 relative z-10">
              <span>Phím</span>
              <kbd>←</kbd>
              <span>Chưa thuộc</span>
              <span>•</span>
              <kbd>→</kbd>
              <span>Đã thuộc</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nút Điều Khiển Đã Thuộc / Chưa Thuộc */}
      <div className="grid grid-cols-2 gap-3.5 pt-1">
        <button
          type="button"
          onClick={() => handleNext(false)}
          className="py-4 px-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-200 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs sm:text-sm shadow-sm border border-stone-200/80 dark:border-white/[0.08] hover:border-rose-400/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <X size={18} className="text-rose-500" />
          <span>Chưa thuộc</span>
          <kbd>← / 1</kbd>
        </button>

        <button
          type="button"
          onClick={() => handleNext(true)}
          className="py-4 px-4 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-torii-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Check size={18} className="stroke-[3]" />
          <span>Đã thuộc</span>
          <kbd className="bg-white/20 text-white border-white/30">→ / 2</kbd>
        </button>
      </div>
    </div>
  );
}
