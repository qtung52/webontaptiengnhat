'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getKanjiVocabFiltered, generateKanjiVocabQuizList, KanjiVocabQuizQuestion } from '@/lib/kanji-data';
import { JLPTLevel } from '@/types';
import { AudioButton } from '@/components/AudioButton';
import { playChime } from '@/lib/sound';
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function KanjiQuizContent() {
  const searchParams = useSearchParams();
  const level = (searchParams.get('level') as JLPTLevel | 'ALL') || 'ALL';
  const topic = searchParams.get('topic') || 'ALL';

  const rawVocabList = useMemo(() => {
    return getKanjiVocabFiltered(level, topic);
  }, [level, topic]);

  const [questions, setQuestions] = useState<KanjiVocabQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<KanjiVocabQuizQuestion[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Sinh bộ câu hỏi trắc nghiệm
  const startQuiz = useCallback((count: number = 15) => {
    if (rawVocabList.length === 0) return;
    const qList = generateKanjiVocabQuizList(rawVocabList, Math.min(count, rawVocabList.length * 2));
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setWrongQuestions([]);
    setIsFinished(false);
  }, [rawVocabList]);

  useEffect(() => {
    startQuiz(15);
  }, [startQuiz]);

  const currentQ: KanjiVocabQuizQuestion | undefined = questions[currentIndex];

  const handleSelect = useCallback(
    (option: string) => {
      if (isAnswered || !currentQ) return;

      setSelectedOption(option);
      setIsAnswered(true);

      const isCorrect = option === currentQ.correctAnswer;
      if (isCorrect) {
        setScore(s => s + 10 + streak * 2);
        setStreak(curr => {
          const next = curr + 1;
          setMaxStreak(m => Math.max(m, next));
          return next;
        });
      } else {
        setStreak(0);
        setWrongQuestions(prev => [...prev, currentQ]);
      }
    },
    [isAnswered, currentQ, streak]
  );

  const handleNext = useCallback(() => {
    if (!isAnswered) return;

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      playChime('complete');
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }
  }, [isAnswered, currentIndex, questions.length]);

  // Phím tắt bàn phím: 1, 2, 3, 4 để chọn, Enter để tiếp tục
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (!isAnswered && currentQ) {
        if (e.key === '1' && currentQ.options[0]) handleSelect(currentQ.options[0]);
        if (e.key === '2' && currentQ.options[1]) handleSelect(currentQ.options[1]);
        if (e.key === '3' && currentQ.options[2]) handleSelect(currentQ.options[2]);
        if (e.key === '4' && currentQ.options[3]) handleSelect(currentQ.options[3]);
      } else if (isAnswered) {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, currentQ, handleSelect, handleNext]);

  if (rawVocabList.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4">
        <BookOpen size={48} className="mx-auto text-stone-300 dark:text-stone-600" />
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Không có từ vựng chữ Hán nào theo bộ lọc
        </h2>
        <p className="text-xs text-stone-500">
          Vui lòng chọn cấp độ hoặc bài học khác để bắt đầu trắc nghiệm.
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

  const progressPercent = questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header & Stats */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/kanji/study?level=${level}&topic=${encodeURIComponent(topic)}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={15} />
          <span>Võ đài Hán tự</span>
        </Link>

        {/* Streak & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
            <Flame size={14} className={streak > 1 ? 'animate-bounce text-orange-500' : ''} />
            <span>Streak {streak}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-black">
            <span>{score} điểm</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-stone-400">
          <span>Câu {currentIndex + 1} / {questions.length}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-stone-200/70 dark:bg-stone-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Kết Quả Tổng Kết */}
      {isFinished ? (
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-6 shadow-xl animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
            <Award size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
              Hoàn Thành Bài Trắc Nghiệm Từ Vựng!
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Bạn đã trả lời đúng {questions.length - wrongQuestions.length} / {questions.length} câu.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <span className="text-2xl font-black block">{score}</span>
              <span className="text-[11px] font-bold">Tổng điểm</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <span className="text-2xl font-black block">{maxStreak}</span>
              <span className="text-[11px] font-bold">Chuỗi đúng kỷ lục</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl font-black block">
                {Math.round(((questions.length - wrongQuestions.length) / questions.length) * 100)}%
              </span>
              <span className="text-[11px] font-bold">Độ chính xác</span>
            </div>
          </div>

          {/* Danh sách câu sai nếu có */}
          {wrongQuestions.length > 0 && (
            <div className="text-left space-y-2 max-w-md mx-auto p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                Các từ cần ôn lại ({wrongQuestions.length} từ):
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {wrongQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="text-xs flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/50 dark:border-white/5"
                  >
                    <span className="font-jp font-black text-sm text-stone-900 dark:text-stone-100">
                      {q.vocabItem.word}
                    </span>
                    <span className="text-torii-500 font-jp font-bold">
                      [{q.vocabItem.reading}]
                    </span>
                    <span className="text-stone-500 font-medium">
                      {q.vocabItem.meaningVi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startQuiz(15)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              Làm lại bài khác
            </button>
            <Link
              href={`/kanji/study/typing?level=${level}&topic=${encodeURIComponent(topic)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              Sang Luyện gõ từ vựng →
            </Link>
          </div>
        </div>
      ) : currentQ ? (
        /* Thẻ Câu Hỏi */
        <div className="space-y-4">
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm text-center space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                {currentQ.vocabItem.level}
              </span>
              <span className="truncate max-w-[200px]">{currentQ.vocabItem.topic}</span>
            </div>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">
              {currentQ.subPrompt}
            </p>

            {/* Từ vựng to rõ */}
            <div className="py-2">
              <span className="font-jp text-5xl sm:text-7xl font-black text-stone-900 dark:text-stone-100 drop-shadow-sm inline-block">
                {currentQ.question}
              </span>
            </div>

            {/* Audio Button */}
            <div className="flex justify-center">
              <AudioButton text={currentQ.vocabItem.word} size="sm" />
            </div>
          </div>

          {/* 4 Lựa Chọn Đáp Án */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let btnStyle =
                'bg-white/80 dark:bg-stone-900/80 border-stone-200/80 dark:border-white/[0.08] text-stone-800 dark:text-stone-200 hover:border-blue-500/40 hover:bg-blue-500/5';

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20';
                } else {
                  btnStyle = 'opacity-40 bg-stone-100 dark:bg-stone-800 border-transparent text-stone-400';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelect(option)}
                  className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all duration-200 text-left active:scale-[0.98] ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        isAnswered && (isCorrect || isSelected)
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-100 dark:bg-white/10 text-stone-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-jp text-base">{option}</span>
                  </div>

                  {isAnswered && (
                    <div>
                      {isCorrect && <CheckCircle2 size={18} className="text-white" />}
                      {isSelected && !isCorrect && <XCircle size={18} className="text-white" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Giải Thích & Nút Tiếp Theo khi đã trả lời */}
          {isAnswered && (
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-white/10 space-y-3 animate-fade-in shadow-lg">
              <div className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{currentQ.explanation}</p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 transition-all"
              >
                <span>Câu tiếp theo</span>
                <span className="text-xs opacity-75 font-normal">(Nhấn Enter ↵)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function KanjiQuizPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Đang chuẩn bị đề trắc nghiệm...</div>}>
      <KanjiQuizContent />
    </Suspense>
  );
}
