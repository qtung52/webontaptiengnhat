'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { RotateCcw, Check, X, ArrowRight, ArrowLeft, Volume2, BookOpen, Sparkles, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WritePage() {
  const { studyWords, updateWordSRS, recordStudyResult, settings } = useApp();

  // Danh sách từ theo các bộ giáo trình và chủ đề đã chọn
  const activePool = studyWords;

  // Bộ từ cố định trong suốt phiên học
  const [sessionWords, setSessionWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wrongItems, setWrongItems] = useState<{ word: VocabWord; answerGiven: string; correctAnswer: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const feedbackTimeRef = useRef<number>(0);

  // Khởi tạo danh sách từ ngẫu nhiên 1 lần khi load pool
  useEffect(() => {
    if (activePool.length > 0 && !initializedRef.current) {
      setSessionWords([...activePool].sort(() => Math.random() - 0.5));
      initializedRef.current = true;
    }
  }, [activePool]);

  const currentWord: VocabWord | undefined = sessionWords[currentIndex];

  // Phát hiện chế độ Kana phù hợp (Hiragana hoặc Katakana)
  const expectedKana = useMemo(() => {
    if (!currentWord) return 'hiragana';
    const target = currentWord.reading || currentWord.japanese;
    return detectExpectedKanaMode(target);
  }, [currentWord]);

  // Tự động focus ô nhập khi sang từ mới hoặc khi đóng modal
  useEffect(() => {
    if (!isFinished && !feedback) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [currentIndex, isFinished, feedback]);

  // 1. Nhấn Enter lần 1: Nộp bài và bật POP-UP thông báo kết quả
  const handleSubmit = useCallback(() => {
    if (!currentWord || !userInput.trim() || feedback) return;

    const submittedVal = userInput.trim();
    setLastSubmitted(submittedVal);

    const targetReading = currentWord.reading || currentWord.japanese;
    const targetKanji = currentWord.japanese;
    const isKata = detectExpectedKanaMode(targetReading) === 'katakana';

    // So sánh đáp án: khớp với reading HOẶC kanji, hỗ trợ Romaji/Kana chuẩn hóa
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
      updateWordSRS(currentWord.id, 5);
    } else {
      setFeedback('wrong');
      setWrongItems(prev => [
        ...prev,
        {
          word: currentWord,
          answerGiven: submittedVal,
          correctAnswer: `${currentWord.japanese}${
            currentWord.reading && currentWord.reading !== currentWord.japanese
              ? ` (${currentWord.reading})`
              : ''
          }`,
        },
      ]);
      updateWordSRS(currentWord.id, 2);
    }
  }, [currentWord, userInput, feedback, settings.acceptRomaji, updateWordSRS]);

  // 2. Nhấn Enter khi Pop-up đang mở: Đóng Pop-up & chuyển sang từ tiếp theo
  const handleNext = useCallback(() => {
    if (!feedback) return;

    setFeedback(null);
    setUserInput('');
    setLastSubmitted('');

    if (currentIndex + 1 < sessionWords.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      recordStudyResult(score, sessionWords.length);
    }
  }, [feedback, currentIndex, sessionWords.length, score, recordStudyResult]);

  // Lắng nghe phím Enter toàn cục khi modal đang bật để qua câu tiếp theo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback && e.key === 'Enter') {
        // Bỏ qua nếu pop-up vừa bật chưa tới 250ms để ngăn phím Enter nộp bài làm tắt pop-up
        if (Date.now() - feedbackTimeRef.current < 250) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, handleNext]);

  if (sessionWords.length === 0) {
    return (
      <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4 max-w-md mx-auto shadow-xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">Chưa có từ vựng nào!</h2>
        <p className="text-xs text-stone-500 font-medium">
          Hãy kích hoạt ít nhất một bộ giáo trình có từ vựng để bắt đầu luyện gõ từ.
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
  if (isFinished) {
    return (
      <div className="max-w-md mx-auto p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
          <CheckCircle size={40} />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            Hoàn Thành Phiên Luyện Gõ!
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 font-medium">
            Điểm số: <span className="font-black text-torii-500 text-sm">{score}</span> / {sessionWords.length} từ chính xác
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/80 dark:border-white/10 text-xs space-y-2">
          <div className="flex justify-between font-bold">
            <span className="text-stone-500">Độ chuẩn xác:</span>
            <span className="text-torii-600 dark:text-torii-400 font-mono text-sm">
              {Math.round((score / sessionWords.length) * 100)}%
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-stone-500">Cần rèn luyện lại:</span>
            <span className="text-red-500 font-mono text-sm">{wrongItems.length} từ</span>
          </div>
        </div>

        {wrongItems.length > 0 && (
          <div className="text-left space-y-2 max-h-48 overflow-y-auto pr-1">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Từ cần ôn lại:</p>
            {wrongItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-jp font-bold text-stone-900 dark:text-stone-100 text-sm">
                    {item.word.japanese}
                  </span>
                  <span className="text-stone-400 ml-2">({item.word.meaningVi})</span>
                </div>
                <AudioButton text={item.word.japanese} size="sm" />
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSessionWords([...activePool].sort(() => Math.random() - 0.5));
              setCurrentIndex(0);
              setUserInput('');
              setFeedback(null);
              setScore(0);
              setWrongItems([]);
              setIsFinished(false);
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-lg shadow-torii-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Luyện lại lượt mới</span>
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

  if (!currentWord) return null;

  const progressPercent = Math.round(((currentIndex + 1) / sessionWords.length) * 100);

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
          <CheckCircle size={14} className="text-emerald-500" />
          <span>Gõ Đáp Án & Điền Từ</span>
        </div>
      </div>

      {/* Top Bar Tiến Độ */}
      <div className="space-y-2 p-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-stone-600 dark:text-stone-300">
            Từ #{currentIndex + 1} / {sessionWords.length}
          </span>
          <span className="text-torii-600 dark:text-torii-400 font-mono">
            Đúng: {score} từ
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-white/5 overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-torii-500 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/30"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Thẻ Đề Bài: HIỆN NGHĨA TIẾNG VIỆT TO RÕ */}
      <div className="p-7 sm:p-9 rounded-[2.5rem] bg-white/90 dark:bg-[#0c1017]/95 backdrop-blur-2xl border-2 border-stone-200/90 dark:border-white/[0.1] shadow-2xl text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-stone-400 relative z-10">
          <span className="font-medium">Hãy gõ từ tiếng Nhật tương ứng với nghĩa:</span>
          <div className="flex items-center gap-2">
            {currentWord.topic && (
              <span className="text-[11px] px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-medium truncate max-w-[200px] border border-stone-200/60 dark:border-white/5">
                {currentWord.topic}
              </span>
            )}
            <AudioButton text={currentWord.reading || currentWord.japanese} size="sm" title="Nghe phát âm" />
          </div>
        </div>

        {/* NGHĨA TIẾNG VIỆT TO RÕ */}
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

      {/* Ô Nhập Tiếng Nhật & Phím Chuyển Đổi */}
      <div className="space-y-3.5">
        <KanaInput
          ref={inputRef}
          value={userInput}
          onChange={setUserInput}
          defaultMode={expectedKana}
          onEnterPress={handleSubmit}
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
          onClick={handleSubmit}
          disabled={!userInput.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 disabled:opacity-40 text-white font-extrabold text-sm shadow-lg shadow-torii-500/25 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Kiểm tra đáp án</span>
          <kbd className="bg-white/20 text-white border-white/30 hidden sm:inline text-[10px]">Enter ↵</kbd>
        </button>

        <div className="text-center text-[11px] text-stone-400 font-medium">
          <span>Gõ tiếng Nhật bằng Romaji (WanaKana) rồi nhấn Enter</span>
        </div>
      </div>

      {/* POP-UP THÔNG BÁO KẾT QUẢ ĐÚNG / SAI KÈM ĐÁP ÁN CHUẨN (2-Step Enter) */}
      <Modal
        isOpen={Boolean(feedback)}
        onClose={handleNext}
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
              onClick={handleNext}
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
