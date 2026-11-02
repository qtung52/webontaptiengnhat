'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { VocabWord } from '@/types';
import { AudioButton } from '@/components/AudioButton';
import { RotateCcw, Award, Check, X, ArrowRight, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

type QuizQuestionType = 'jp_to_vi' | 'vi_to_jp' | 'reading_to_kanji';

interface QuizQuestion {
  word: VocabWord;
  type: QuizQuestionType;
  prompt: string;
  subPrompt?: string;
  correctAnswer: string;
  options: string[];
}

function generateQuizQuestions(pool: VocabWord[]): QuizQuestion[] {
  if (pool.length < 4) return [];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const quizList: QuizQuestion[] = [];

  shuffled.forEach(targetWord => {
    const rand = Math.random();
    let type: QuizQuestionType = 'jp_to_vi';
    let prompt = targetWord.japanese;
    let subPrompt = targetWord.reading && targetWord.reading !== targetWord.japanese ? targetWord.reading : undefined;
    let correctAnswer = targetWord.meaningVi;

    if (rand < 0.35) {
      type = 'vi_to_jp';
      prompt = targetWord.meaningVi;
      subPrompt = 'Chọn từ tiếng Nhật tương ứng:';
      correctAnswer = targetWord.japanese;
    } else if (rand < 0.65 && targetWord.reading && targetWord.reading !== targetWord.japanese) {
      type = 'reading_to_kanji';
      prompt = targetWord.reading;
      subPrompt = 'Cách đọc trên là của chữ Hán nào?';
      correctAnswer = targetWord.japanese;
    } else {
      type = 'jp_to_vi';
      prompt = targetWord.japanese;
      subPrompt = 'Nghĩa tiếng Việt là gì?';
      correctAnswer = targetWord.meaningVi;
    }

    const distractors: string[] = [];
    const others = pool.filter(w => w.id !== targetWord.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

    for (const other of shuffledOthers) {
      if (distractors.length >= 3) break;
      const candidate = type === 'jp_to_vi' ? other.meaningVi : other.japanese;
      if (candidate !== correctAnswer && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
    }

    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    quizList.push({
      word: targetWord,
      type,
      prompt,
      subPrompt,
      correctAnswer,
      options,
    });
  });

  return quizList;
}

export default function QuizPage() {
  const { studyWords, updateWordSRS, recordStudyResult } = useApp();

  // Danh sách từ theo bộ giáo trình và chủ đề đã chọn
  const activePool = studyWords;

  // Bộ câu hỏi trắc nghiệm CỐ ĐỊNH trong suốt lượt thi (không bị xáo trộn khi gọi updateWordSRS)
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<{ q: QuizQuestion; chosen: string }[]>([]);

  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Khởi tạo câu hỏi 1 lần khi load pool đủ từ
  useEffect(() => {
    if (activePool.length >= 4 && !initializedRef.current) {
      setQuestions(generateQuizQuestions(activePool));
      initializedRef.current = true;
    }
  }, [activePool]);

  const currentQ: QuizQuestion | undefined = questions[currentIndex];

  // Chuyển sang câu kế tiếp
  const advanceToNext = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    setSelectedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      recordStudyResult(score, questions.length);
    }
  }, [currentIndex, questions.length, score, recordStudyResult]);

  // Xử lý khi người dùng chọn phương án
  const handleSelectOption = useCallback(
    (option: string) => {
      if (selectedOption !== null || !currentQ) return;

      setSelectedOption(option);
      const isCorrect = option === currentQ.correctAnswer;

      if (isCorrect) {
        setScore(prev => prev + 1);
        updateWordSRS(currentQ.word.id, 5); // SM-2 hoàn hảo
      } else {
        setWrongAnswers(prev => [...prev, { q: currentQ, chosen: option }]);
        updateWordSRS(currentQ.word.id, 2); // SM-2 cần ôn lại
      }

      // Tự động chuyển sau 2.2 giây nếu người dùng không bấm Enter sớm hơn
      advanceTimerRef.current = setTimeout(() => {
        advanceToNext();
      }, 2200);
    },
    [selectedOption, currentQ, updateWordSRS, advanceToNext]
  );

  // Hỗ trợ phím tắt 1, 2, 3, 4 để chọn đáp án và Enter để chuyển nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (selectedOption === null && currentQ) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (currentQ.options[idx]) {
            e.preventDefault();
            handleSelectOption(currentQ.options[idx]);
          }
        }
      } else if (selectedOption !== null) {
        if (e.key === 'Enter') {
          e.preventDefault();
          advanceToNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, currentQ, handleSelectOption, advanceToNext]);

  // Dọn dẹp timer
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  if (activePool.length < 4) {
    return (
      <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4 max-w-md mx-auto shadow-xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">Cần ít nhất 4 từ vựng!</h2>
        <p className="text-xs text-stone-500 font-medium">
          Chế độ trắc nghiệm 4 lựa chọn cần tối thiểu 4 từ trong bài học đã chọn để sinh phương án gây nhiễu.
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

  // Màn hình kết thúc
  if (isFinished) {
    return (
      <div className="max-w-md mx-auto p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
          <Award size={40} />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            Tổng Kết Trắc Nghiệm!
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 font-medium">
            Điểm số của bạn: <span className="font-black text-torii-500 text-sm">{score}</span> / {questions.length} câu đúng
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/80 dark:border-white/10 text-xs space-y-1.5">
          <div className="flex justify-between font-bold">
            <span className="text-stone-500">Tỷ lệ chính xác:</span>
            <span className="text-torii-600 dark:text-torii-400 font-mono text-sm">
              {Math.round((score / questions.length) * 100)}%
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-stone-500">Số câu chưa chuẩn:</span>
            <span className="text-red-500 font-mono text-sm">{wrongAnswers.length}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setQuestions(generateQuizQuestions(activePool));
              setCurrentIndex(0);
              setSelectedOption(null);
              setScore(0);
              setWrongAnswers([]);
              setIsFinished(false);
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-lg shadow-torii-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Thi lại lượt mới</span>
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

  if (!currentQ) {
    return (
      <div className="text-center py-12 text-stone-400 text-xs">
        Đang chuẩn bị câu hỏi...
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

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
          <Award size={14} className="text-blue-500" />
          <span>Trắc Nghiệm 4 Lựa Chọn</span>
        </div>
      </div>

      {/* Top Bar Tiến Độ & Điểm Số */}
      <div className="space-y-2 p-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-stone-600 dark:text-stone-300">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-torii-600 dark:text-torii-400 font-mono">
            Điểm: {score}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-white/5 overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-torii-500 rounded-full transition-all duration-300 shadow-sm shadow-blue-500/30"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Thẻ Câu Hỏi */}
      <div className="p-7 sm:p-9 rounded-[2.5rem] bg-white/90 dark:bg-[#0c1017]/95 backdrop-blur-2xl border-2 border-stone-200/90 dark:border-white/[0.1] shadow-2xl text-center space-y-3.5 relative overflow-hidden">
        <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-stone-400 relative z-10">
          <span className="font-medium">{currentQ.subPrompt || 'Chọn đáp án đúng:'}</span>
          <AudioButton text={currentQ.word.japanese} size="sm" />
        </div>

        <div className="font-jp text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 dark:text-stone-100 py-3 relative z-10 tracking-tight drop-shadow-sm">
          {currentQ.prompt}
        </div>

        {currentQ.word.hanViet && currentQ.type === 'jp_to_vi' && (
          <div className="relative z-10">
            <span className="text-xs font-bold text-torii-600 dark:text-torii-400 uppercase tracking-widest inline-block px-3 py-1 rounded-full bg-torii-500/10 border border-torii-500/20">
              Hán Việt: [{currentQ.word.hanViet}]
            </span>
          </div>
        )}
      </div>

      {/* 4 Phương Án Trắc Nghiệm Siêu Đẹp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {currentQ.options.map((option, idx) => {
          let btnStyle =
            'bg-white/80 dark:bg-stone-900/80 border-stone-200/90 dark:border-white/[0.08] hover:border-torii-400 hover:shadow-lg text-stone-800 dark:text-stone-200';

          if (selectedOption !== null) {
            if (option === currentQ.correctAnswer) {
              btnStyle =
                'bg-emerald-500 border-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 scale-102';
            } else if (option === selectedOption) {
              btnStyle =
                'bg-rose-500 border-rose-500 text-white font-bold shadow-lg shadow-rose-500/30';
            } else {
              btnStyle = 'opacity-35 border-stone-200/60 dark:border-white/5';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={selectedOption !== null}
              onClick={() => handleSelectOption(option)}
              className={`p-4 sm:p-5 rounded-2xl border-2 text-left font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-between select-none active:scale-98 backdrop-blur-md ${btnStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                    selectedOption !== null && (option === currentQ.correctAnswer || option === selectedOption)
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="font-jp leading-snug font-semibold">{option}</span>
              </div>
              {selectedOption !== null && option === currentQ.correctAnswer && (
                <Check size={20} className="shrink-0 ml-2 stroke-[3]" />
              )}
              {selectedOption === option && option !== currentQ.correctAnswer && (
                <X size={20} className="shrink-0 ml-2 stroke-[3]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Thanh Thông Báo Kết Quả Rõ Ràng & Nút Sang Câu Kế Tiếp */}
      {selectedOption !== null && (
        <div
          className={`p-5 rounded-3xl border text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-xl ${
            selectedOption === currentQ.correctAnswer
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {selectedOption === currentQ.correctAnswer ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                  <Check size={18} className="stroke-[3]" />
                </div>
                <div>
                  <p className="font-black text-sm">Chính xác! 🎉</p>
                  <div className="text-[11px] opacity-90 font-jp flex items-center gap-2 mt-0.5">
                    <span>
                      {currentQ.word.japanese}{' '}
                      {currentQ.word.reading && `[${currentQ.word.reading}]`} : {currentQ.word.meaningVi}
                    </span>
                    <AudioButton text={currentQ.word.japanese} size="sm" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30">
                  <X size={18} className="stroke-[3]" />
                </div>
                <div>
                  <p className="font-black text-sm">Chưa chính xác!</p>
                  <div className="text-[11px] flex items-center gap-2 mt-0.5">
                    <span>
                      Đáp án đúng:{' '}
                      <span className="font-bold font-jp text-emerald-600 dark:text-emerald-400">
                        {currentQ.correctAnswer}
                      </span>{' '}
                      ({currentQ.word.japanese}{' '}
                      {currentQ.word.reading ? `[${currentQ.word.reading}]` : ''})
                    </span>
                    <AudioButton text={currentQ.word.japanese} size="sm" />
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={advanceToNext}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition-all shrink-0 flex items-center justify-center gap-2 text-white active:scale-95 ${
              selectedOption === currentQ.correctAnswer
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 shadow-torii-500/30'
            }`}
          >
            <span>Câu tiếp theo</span>
            <kbd className="bg-white/20 text-white border-white/30 text-[10px]">Enter ↵</kbd>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
