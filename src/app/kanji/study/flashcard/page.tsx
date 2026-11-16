'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getKanjiVocabFiltered, KanjiVocabItem } from '@/lib/kanji-data';
import { JLPTLevel } from '@/types';
import { AudioButton } from '@/components/AudioButton';
import { speakJapanese, playChime } from '@/lib/sound';
import {
  RotateCcw,
  Check,
  X,
  ArrowLeft,
  Sparkles,
  Shuffle,
  BookOpen,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function KanjiFlashcardContent() {
  const searchParams = useSearchParams();
  const level = (searchParams.get('level') as JLPTLevel | 'ALL') || 'ALL';
  const topic = searchParams.get('topic') || 'ALL';

  const rawVocabList = useMemo(() => {
    return getKanjiVocabFiltered(level, topic);
  }, [level, topic]);

  const [cards, setCards] = useState<KanjiVocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [learningIds, setLearningIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Khởi tạo và xáo bài
  useEffect(() => {
    if (rawVocabList.length > 0) {
      setCards([...rawVocabList].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredIds([]);
      setLearningIds([]);
      setIsCompleted(false);
    }
  }, [rawVocabList]);

  const currentCard: KanjiVocabItem | undefined = cards[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
    playChime('click');
  }, []);

  const handleNext = useCallback(
    (know: boolean) => {
      if (!currentCard) return;

      if (know) {
        setMasteredIds(prev => (prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]));
      } else {
        setLearningIds(prev => (prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]));
      }

      setIsFlipped(false);

      if (currentIndex + 1 < cards.length) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 120);
      } else {
        setIsCompleted(true);
        playChime('complete');
        try {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    },
    [currentCard, currentIndex, cards.length]
  );

  const handleShuffle = useCallback(() => {
    setCards(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    playChime('click');
  }, []);

  const handleRestart = useCallback(() => {
    setCards([...rawVocabList].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds([]);
    setLearningIds([]);
    setIsCompleted(false);
  }, [rawVocabList]);

  const handleReviewLearning = useCallback(() => {
    const unmastered = rawVocabList.filter(k => learningIds.includes(k.id));
    if (unmastered.length > 0) {
      setCards([...unmastered].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredIds([]);
      setLearningIds([]);
      setIsCompleted(false);
    }
  }, [rawVocabList, learningIds]);

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleNext(false);
      } else if (e.code === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleNext(true);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleShuffle();
      } else if (e.key.toLowerCase() === 's' && currentCard) {
        e.preventDefault();
        speakJapanese(currentCard.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handleShuffle, currentCard]);

  if (rawVocabList.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4">
        <BookOpen size={48} className="mx-auto text-stone-300 dark:text-stone-600" />
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Không có từ vựng chữ Hán nào theo bộ lọc
        </h2>
        <p className="text-xs text-stone-500">
          Vui lòng chọn cấp độ hoặc bài học khác để bắt đầu luyện tập.
        </p>
        <Link
          href="/kanji/study"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-torii-500 text-white font-bold text-xs"
        >
          <ArrowLeft size={16} />
          Quay lại Võ đài
        </Link>
      </div>
    );
  }

  const progressPercent = cards.length > 0 ? Math.round((currentIndex / cards.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Top Bar Navigation & Progress */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/kanji/study?level=${level}&topic=${encodeURIComponent(topic)}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={15} />
          <span>Võ đài Hán tự</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400">
          <span>
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <span className="text-stone-300 dark:text-stone-600">•</span>
          <span className="text-torii-500">{progressPercent}%</span>
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          title="Xáo trộn thẻ (Phím R)"
          className="p-2 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-white/[0.08] text-stone-500 hover:text-torii-500 transition-colors shadow-sm active:scale-95"
        >
          <Shuffle size={16} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-stone-200/70 dark:bg-stone-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-torii-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Màn hình hoàn tất */}
      {isCompleted ? (
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-6 shadow-xl animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <Award size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
              Xuất sắc! Đã hoàn thành bộ thẻ từ vựng!
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Bạn đã lướt qua toàn bộ {cards.length} từ vựng chữ Hán trong lượt ôn này.
            </p>
          </div>

          {/* Thống kê thuộc / chưa thuộc */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <span className="text-3xl font-black block">{masteredIds.length}</span>
              <span className="text-xs font-bold">Đã thuộc</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
              <span className="text-3xl font-black block">{learningIds.length}</span>
              <span className="text-xs font-bold">Cần ôn thêm</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {learningIds.length > 0 && (
              <button
                type="button"
                onClick={handleReviewLearning}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-torii-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all"
              >
                Ôn lại {learningIds.length} từ chưa thuộc
              </button>
            )}
            <button
              type="button"
              onClick={handleRestart}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 font-extrabold text-xs active:scale-95 transition-all"
            >
              Luyện lại toàn bộ
            </button>
            <Link
              href={`/kanji/study/quiz?level=${level}&topic=${encodeURIComponent(topic)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              Sang làm Trắc nghiệm →
            </Link>
          </div>
        </div>
      ) : currentCard ? (
        /* Thẻ Flashcard chính */
        <div className="space-y-4">
          <div
            onClick={handleFlip}
            className="relative min-h-[380px] sm:min-h-[420px] rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 hover:border-torii-500/40 hover:shadow-2xl hover:shadow-torii-500/10 active:scale-[0.99] group shadow-sm"
          >
            {/* Header thẻ: Badge thông tin */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                  {currentCard.level}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 truncate max-w-[200px]">
                  {currentCard.topic}
                </span>
              </div>

              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <AudioButton text={currentCard.word} size="md" />
              </div>
            </div>

            {/* Nội dung thẻ (Mặt trước vs Mặt sau) */}
            {!isFlipped ? (
              /* MẶT TRƯỚC: Từ vựng chữ Hán to rõ */
              <div className="my-auto text-center space-y-4 py-8">
                <div className="font-jp text-6xl sm:text-8xl font-black text-stone-900 dark:text-stone-100 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm">
                  {currentCard.word}
                </div>
                <p className="text-xs text-stone-400 font-medium flex items-center justify-center gap-1.5">
                  <Sparkles size={14} className="text-rose-500" />
                  <span>Chạm thẻ hoặc bấm [Phím Cách] để lật xem cách đọc Furigana & nghĩa</span>
                </p>
              </div>
            ) : (
              /* MẶT SAU: Furigana, Hán Việt, Nghĩa, Cấu tạo chữ Hán */
              <div className="my-auto space-y-4 py-2 animate-fade-in text-center">
                {/* Cách đọc Furigana to rõ */}
                <div className="space-y-1">
                  <h3 className="font-jp text-4xl sm:text-5xl font-black text-rose-500 drop-shadow-sm">
                    {currentCard.reading}
                  </h3>
                  <p className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                    {currentCard.hanViet}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-stone-600 dark:text-stone-300">
                    Nghĩa: {currentCard.meaningVi}
                  </p>
                </div>

                {/* Chi tiết từng chữ Hán trong từ */}
                {currentCard.notes && currentCard.notes.length > 0 && (
                  <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5 space-y-2 text-left">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Các chữ Hán cấu thành:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentCard.notes.map((n, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/50 dark:border-white/5 text-xs"
                        >
                          <span className="font-jp text-lg font-black text-torii-600 dark:text-torii-400">
                            {n.kanji}
                          </span>
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-100 uppercase text-[11px]">
                              {n.hanViet}
                            </p>
                            <p className="text-[10px] text-stone-400 truncate">{n.meaningVi}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer thẻ */}
            <div className="text-center text-[11px] text-stone-400 pt-2 border-t border-stone-100 dark:border-white/[0.04]">
              Từ vựng Hán tự • Manabiman
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <button
              type="button"
              onClick={() => handleNext(false)}
              className="py-4 px-5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 border border-stone-200/80 dark:border-white/10 text-stone-700 dark:text-stone-300 font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <X size={18} />
              <span>Chưa thuộc (← / 1)</span>
            </button>

            <button
              type="button"
              onClick={() => handleNext(true)}
              className="py-4 px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-torii-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all active:scale-95"
            >
              <Check size={18} />
              <span>Đã thuộc (→ / 2)</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function KanjiFlashcardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Đang chuẩn bị thẻ từ vựng Hán tự...</div>}>
      <KanjiFlashcardContent />
    </Suspense>
  );
}
