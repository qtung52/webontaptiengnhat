'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { VocabWord } from '@/types';
import { KanaInput } from '@/components/KanaInput';
import { AudioButton } from '@/components/AudioButton';
import { Modal } from '@/components/Modal';
import {
  compareJapaneseAnswers,
  detectExpectedKanaMode,
} from '@/lib/wanakana-helper';
import { playChime } from '@/lib/sound';
import {
  Clock,
  Flame,
  RotateCcw,
  Award,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Volume2,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TypingPracticePage() {
  const { studyWords, settings, recordStudyResult } = useApp();

  // Danh sách từ theo các bộ giáo trình và chủ đề đã chọn
  const pool = studyWords;

  // Cố định danh sách từ trong suốt 1 lượt chơi (tránh xáo trộn ngầm khi đang gõ)
  const [sessionWords, setSessionWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const [correctList, setCorrectList] = useState<string[]>([]);
  const [wrongList, setWrongList] = useState<
    { word: string; reading?: string; meaning?: string; answerGiven: string }[]
  >([]);

  // Trạng thái bật POP-UP kết quả đúng/sai kèm đáp án chuẩn (2-Step Enter)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeRef = useRef<number>(0);

  // Bắt đầu game
  const startGame = () => {
    if (pool.length === 0) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSessionWords(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setGameStarted(true);
    setUserInput('');
    setCorrectList([]);
    setWrongList([]);
    setFeedback(null);
    setLastSubmitted('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Đồng hồ đếm ngược (chỉ chạy khi chưa có pop-up kết quả)
  useEffect(() => {
    if (!gameStarted || isGameOver || feedback) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, isGameOver, feedback]);

  const endGame = () => {
    setIsGameOver(true);
    setGameStarted(false);
    playChime('complete');
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch { }
    recordStudyResult(score, score + wrongList.length);
  };

  const currentWord: VocabWord | undefined = sessionWords[currentIndex];

  // 1. Nhấn Enter lần 1: Nộp câu trả lời & hiển thị pop-up thông báo đúng/sai
  const handleSubmitAnswer = useCallback(() => {
    if (!currentWord || !userInput.trim() || feedback) return;

    const submittedVal = userInput.trim();
    setLastSubmitted(submittedVal);

    const targetReading = currentWord.reading || currentWord.japanese;
    const targetKanji = currentWord.japanese;
    const isKata = detectExpectedKanaMode(targetReading) === 'katakana';

    // So sánh: chấp nhận gõ cách đọc (reading), gõ kanji, hoặc gõ romaji tương ứng
    const isCorrectReading = compareJapaneseAnswers(submittedVal, targetReading, {
      acceptRomaji: settings.acceptRomaji,
      strictKatakana: isKata,
    });
    const isCorrectKanji = compareJapaneseAnswers(submittedVal, targetKanji, {
      acceptRomaji: settings.acceptRomaji,
      strictKatakana: isKata,
    });

    const isCorrect = isCorrectReading || isCorrectKanji;

    feedbackTimeRef.current = Date.now();

    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setCorrectList(prev => [...prev, currentWord.japanese]);
    } else {
      setFeedback('wrong');
      setStreak(0);
      setWrongList(prev => [
        ...prev,
        {
          word: currentWord.japanese,
          reading: currentWord.reading,
          meaning: currentWord.meaningVi,
          answerGiven: submittedVal,
        },
      ]);
    }
  }, [currentWord, userInput, feedback, settings.acceptRomaji]);

  // 2. Nhấn Enter khi Pop-up đang mở: Đóng Pop-up & chuyển sang từ tiếp theo
  const handleNextWord = useCallback(() => {
    if (!feedback) return;

    setFeedback(null);
    setUserInput('');
    setLastSubmitted('');

    if (currentIndex + 1 < sessionWords.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Đã hết từ trong bộ, xáo trộn lại để luyện tiếp nếu còn thời gian
      setSessionWords([...pool].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [feedback, currentIndex, sessionWords.length, pool]);

  // Lắng nghe phím Enter toàn cục khi modal đang bật để qua câu tiếp theo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback && e.key === 'Enter') {
        // Ngăn sự kiện Enter nộp bài làm tắt pop-up tức thì
        if (Date.now() - feedbackTimeRef.current < 250) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleNextWord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, handleNextWord]);

  // Màn hình kết thúc trò chơi
  if (isGameOver) {
    const wpm = Math.round(score);

    return (
      <div className="max-w-md mx-auto p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
          <Award size={40} />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            Hết Giờ! Hoàn Thành!
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 font-medium">
            Tốc độ gõ và khả năng phản xạ từ vựng của bạn
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl bg-torii-500/10 border border-torii-500/25">
            <span className="text-xs font-bold text-torii-700 dark:text-torii-400 block mb-1">
              Điểm đạt được
            </span>
            <span className="text-3xl font-black text-torii-600 dark:text-torii-300 font-mono">
              {score}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
              Tốc độ gõ
            </span>
            <span className="text-3xl font-black text-amber-600 dark:text-amber-300 font-mono">
              {wpm} <span className="text-xs font-normal">từ/phút</span>
            </span>
          </div>
        </div>

        {wrongList.length > 0 && (
          <div className="text-left space-y-2 max-h-48 overflow-y-auto pr-1">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Từ gõ chưa chuẩn:</p>
            {wrongList.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-jp font-bold text-stone-900 dark:text-stone-100 text-sm">
                    {item.word}
                  </span>
                  <span className="text-stone-400 ml-2">({item.meaning})</span>
                </div>
                <AudioButton text={item.word} size="sm" />
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-lg shadow-torii-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Thử lại lượt mới</span>
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

  // Màn hình chờ bắt đầu
  if (!gameStarted) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Nút Quay Về */}
        <div className="flex items-center justify-between">
          <Link
            href="/study"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 hover:text-torii-600 dark:hover:text-torii-400 hover:border-torii-400 text-xs font-bold transition-all shadow-sm active:scale-95 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay về Võ Đài</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400">
            <Zap size={14} className="text-orange-500" />
            <span>Luyện Gõ Phản Xạ</span>
          </div>
        </div>

        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/30">
            <Zap size={40} />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
              Luyện Gõ Phản Xạ
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 font-medium leading-relaxed max-w-xs mx-auto">
              Đề bài hiện nghĩa tiếng Việt. Bạn gõ nhanh từ tiếng Nhật tương ứng bằng Romaji tự chuyển Kana (WanaKana).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/80 dark:border-white/10 text-xs space-y-2 text-stone-600 dark:text-stone-400 font-medium text-left">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span>Thời gian làm bài: <strong>60 giây</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Số từ vựng sẵn sàng: <strong>{pool.length} từ</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Bấm <strong>Enter</strong> sau khi gõ để nộp và xem kết quả</span>
            </div>
          </div>

          <button
            type="button"
            onClick={startGame}
            disabled={pool.length === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Bắt đầu thử thách</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  const expectedKana = detectExpectedKanaMode(currentWord.reading);

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
          <Zap size={14} className="text-orange-500" />
          <span>Luyện Gõ Phản Xạ</span>
        </div>
      </div>

      {/* Top Bar: Thời gian & Điểm số */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2 font-mono text-base font-black text-stone-800 dark:text-stone-200">
          <Clock size={18} className="text-orange-500 animate-pulse" />
          <span>{timeLeft}s</span>
        </div>

        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <div className="flex items-center gap-1 text-xs font-black text-amber-500 animate-bounce px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Flame size={14} className="fill-amber-500" />
              <span>x{streak} Combo!</span>
            </div>
          )}

          <div className="text-xs font-bold text-stone-600 dark:text-stone-300">
            Điểm: <span className="text-torii-600 dark:text-torii-400 font-mono font-black text-base">{score}</span>
          </div>
        </div>
      </div>

      {/* Thẻ hiển thị từ câu hỏi: HIỆN NGHĨA TIẾNG VIỆT TO RÕ */}
      <div className="p-7 sm:p-9 rounded-[2.5rem] bg-white/90 dark:bg-[#0c1017]/95 backdrop-blur-2xl border-2 border-stone-200/90 dark:border-white/[0.1] shadow-2xl text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-stone-400 relative z-10">
          <span className="font-medium">Từ #{currentIndex + 1} / {sessionWords.length}</span>
          <div className="flex items-center gap-2">
            {currentWord.topic && (
              <span className="text-[11px] px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-medium truncate max-w-[200px] border border-stone-200/60 dark:border-white/5">
                {currentWord.topic}
              </span>
            )}
            <AudioButton text={currentWord.reading || currentWord.japanese} size="sm" title="Nghe phát âm" />
          </div>
        </div>

        {/* NGHĨA TIẾNG VIỆT LÀM ĐỀ BÀI CHÍNH */}
        <div className="py-4 relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 dark:text-stone-100 leading-tight tracking-tight drop-shadow-sm">
            {currentWord.meaningVi}
          </h2>
          {currentWord.hanViet && (
            <div className="pt-3">
              <span className="inline-block text-xs font-bold text-torii-600 dark:text-torii-400 uppercase tracking-widest px-3 py-1 rounded-full bg-torii-500/10 border border-torii-500/20">
                Hán Việt: [{currentWord.hanViet}]
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ô nhập KanaInput thông minh */}
      <div className="space-y-3.5">
        <KanaInput
          ref={inputRef}
          value={userInput}
          onChange={setUserInput}
          defaultMode={expectedKana}
          onEnterPress={handleSubmitAnswer}
          disabled={Boolean(feedback)}
          placeholder={
            expectedKana === 'katakana'
              ? 'Gõ romaji (vd: arubaito -> アルバイト)...'
              : 'Gõ romaji (vd: taberu -> たべる)...'
          }
          inputClassName="text-center font-bold text-xl md:text-2xl tracking-wider"
        />

        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={!userInput.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Kiểm tra đáp án</span>
          <kbd className="bg-white/20 text-white border-white/30 hidden sm:inline text-[10px]">Enter ↵</kbd>
        </button>

        <div className="flex items-center justify-between px-2 text-xs text-stone-400 font-medium">
          <span>Nhấn Enter để nộp đáp án</span>
          <button
            type="button"
            onClick={endGame}
            className="hover:text-red-500 transition-colors font-semibold"
          >
            Dừng sớm
          </button>
        </div>
      </div>

      {/* POP-UP THÔNG BÁO KẾT QUẢ ĐÚNG / SAI KÈM ĐÁP ÁN CHUẨN */}
      <Modal
        isOpen={Boolean(feedback)}
        onClose={handleNextWord}
        maxWidth="md"
      >
        {currentWord && feedback && (
          <div className="space-y-5 text-center py-1">
            {/* Header Icon & Thông báo */}
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-transform ${
                  feedback === 'correct'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/30'
                    : 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30'
                }`}
              >
                {feedback === 'correct' ? (
                  <Check size={36} className="stroke-[3]" />
                ) : (
                  <X size={36} className="stroke-[3]" />
                )}
              </div>

              <div>
                <h3
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    feedback === 'correct'
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  }`}
                >
                  {feedback === 'correct' ? 'Chính xác! 🎉' : 'Chưa chính xác!'}
                </h3>

                {/* Từ bạn đã nhập: hiển thị nổi bật, rõ nét, không gạch ngang làm vỡ nét chữ */}
                {feedback === 'wrong' && lastSubmitted && (
                  <div className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25">
                    <span className="text-xs text-rose-500/80 dark:text-rose-300 font-medium">Bạn đã nhập:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-jp text-base tracking-wide">
                      {lastSubmitted}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết đáp án đúng: thiết kế kính mờ sang trọng, độ tương phản cao */}
            <div className="p-5 sm:p-6 rounded-2xl bg-stone-50/90 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check size={12} className="stroke-[3]" />
                  Đáp án chuẩn của từ này
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="text-center space-y-1">
                  <div className="font-jp text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 dark:text-stone-50 tracking-wide drop-shadow-sm">
                    {currentWord.japanese}
                  </div>
                  {currentWord.reading && currentWord.reading !== currentWord.japanese && (
                    <p className="font-jp text-base text-torii-600 dark:text-torii-400 font-bold">
                      [{currentWord.reading}]
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium pt-0.5">
                    Nghĩa: <strong className="text-stone-900 dark:text-stone-100">{currentWord.meaningVi}</strong>
                  </p>
                </div>
                <AudioButton text={currentWord.japanese} size="md" />
              </div>
            </div>

            {/* Nút Enter để sang câu tiếp theo */}
            <button
              type="button"
              onClick={handleNextWord}
              className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer ${
                feedback === 'correct'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 shadow-torii-500/25'
              }`}
            >
              <span>Tiếp tục từ tiếp theo</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-black/20 text-white/95 text-[11px] font-mono border border-white/20">
                Enter ↵
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
