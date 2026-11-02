'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { VocabWord } from '@/types';
import { KanaInput } from '@/components/KanaInput';
import { AudioButton } from '@/components/AudioButton';
import { playChime } from '@/lib/sound';
import {
  compareJapaneseAnswers,
  detectExpectedKanaMode,
} from '@/lib/wanakana-helper';
import { Clock, Award, CheckCircle2, XCircle, RotateCcw, ArrowRight, FileCheck, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TestQuestion {
  id: string;
  word: VocabWord;
  type: 'multiple_choice' | 'type_reading';
  prompt: string;
  subPrompt: string;
  correctAnswer: string;
  options?: string[]; // Cho trắc nghiệm
}

export default function MockTestPage() {
  const { studyWords, recordStudyResult, settings } = useApp();

  const activePool = studyWords;

  // Cấu hình trước khi thi
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(5);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Trạng thái bài thi
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sinh đề thi
  const handleStartTest = () => {
    if (activePool.length === 0) return;

    const count = Math.min(questionCount, activePool.length);
    const shuffledPool = [...activePool].sort(() => Math.random() - 0.5).slice(0, count);

    const generated: TestQuestion[] = shuffledPool.map((word, idx) => {
      const isMC = idx % 2 === 0; // Xen kẽ trắc nghiệm và gõ từ
      if (isMC) {
        // Trắc nghiệm: Hiện chữ tiếng Nhật, chọn nghĩa tiếng Việt
        const distractors: string[] = [];
        const others = activePool.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5);
        for (const o of others) {
          if (distractors.length >= 3) break;
          if (o.meaningVi !== word.meaningVi && !distractors.includes(o.meaningVi)) {
            distractors.push(o.meaningVi);
          }
        }
        const options = [word.meaningVi, ...distractors].sort(() => Math.random() - 0.5);

        return {
          id: `q_${word.id}_${idx}`,
          word,
          type: 'multiple_choice',
          prompt: word.japanese,
          subPrompt: 'Chọn nghĩa tiếng Việt chính xác:',
          correctAnswer: word.meaningVi,
          options,
        };
      } else {
        // Gõ tiếng Nhật: HIỂN THỊ NGHĨA TIẾNG VIỆT LÀM ĐỀ BÀI (KHÔNG HIỂN THỊ TRƯỚC TIẾNG NHẬT)
        return {
          id: `q_${word.id}_${idx}`,
          word,
          type: 'type_reading',
          prompt: word.meaningVi,
          subPrompt: 'Hãy gõ từ tiếng Nhật tương ứng với nghĩa:',
          correctAnswer: word.reading || word.japanese,
        };
      }
    });

    setTestQuestions(generated);
    setUserAnswers({});
    setCurrentIdx(0);
    setSecondsRemaining(timeLimitMinutes * 60);
    setIsTestStarted(true);
    setIsSubmitted(false);
  };

  // Đếm ngược thời gian thi
  useEffect(() => {
    if (!isTestStarted || isSubmitted) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTestStarted, isSubmitted]);

  // Focus ô gõ khi chuyển câu
  useEffect(() => {
    if (isTestStarted && !isSubmitted) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [currentIdx, isTestStarted, isSubmitted]);

  // Nộp bài và chấm điểm
  const handleSubmitTest = () => {
    setIsSubmitted(true);
    playChime('complete');

    // Tính điểm
    let correctCount = 0;
    testQuestions.forEach(q => {
      const ans = (userAnswers[q.id] || '').trim();
      if (q.type === 'multiple_choice') {
        if (ans === q.correctAnswer) correctCount++;
      } else {
        const targetReading = q.word.reading || q.word.japanese;
        const targetKanji = q.word.japanese;
        const isKata = detectExpectedKanaMode(targetReading) === 'katakana';
        const matchReading = compareJapaneseAnswers(ans, targetReading, {
          acceptRomaji: settings.acceptRomaji,
          strictKatakana: isKata,
        });
        const matchKanji = compareJapaneseAnswers(ans, targetKanji, {
          acceptRomaji: settings.acceptRomaji,
          strictKatakana: isKata,
        });
        if (matchReading || matchKanji) {
          correctCount++;
        }
      }
    });

    try {
      if (correctCount / testQuestions.length >= 0.7) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } catch {}

    recordStudyResult(correctCount, testQuestions.length);
  };

  // Chuyển sang câu kế tiếp khi gõ xong và bấm Enter
  const handleAdvanceNext = () => {
    if (currentIdx + 1 < testQuestions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Đã là câu cuối cùng
      if (confirm('Bạn đã đến câu cuối cùng. Bạn có muốn nộp bài thi không?')) {
        handleSubmitTest();
      }
    }
  };

  // Format giây thành mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // MÀN HÌNH 1: Cấu hình đề thi trước khi bắt đầu
  if (!isTestStarted) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Link
            href="/study"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 hover:text-torii-600 dark:hover:text-torii-400 hover:border-torii-400 text-xs font-bold transition-all shadow-sm active:scale-95 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay về Võ Đài</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400">
            <Clock size={14} className="text-amber-500" />
            <span>Thi Thử Tính Giờ</span>
          </div>
        </div>

        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
              <FileCheck size={40} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
              Thi Thử Tiếng Nhật
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium max-w-xs mx-auto">
              Kiểm tra toàn diện từ vựng với hình thức trắc nghiệm và gõ từ chuẩn phòng thi JLPT
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 mb-2">
                Số lượng câu hỏi:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[10, 20, 30].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    disabled={activePool.length < cnt}
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2.5 rounded-2xl text-xs font-black border transition-all duration-200 ${
                      questionCount === cnt
                        ? 'bg-gradient-to-r from-torii-500 to-rose-600 border-transparent text-white shadow-md shadow-torii-500/25 scale-102'
                        : 'border-stone-200/80 dark:border-white/[0.08] bg-stone-50 dark:bg-white/[0.03] text-stone-700 dark:text-stone-300 hover:border-torii-300'
                    } disabled:opacity-30`}
                  >
                    {cnt} câu
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 mb-2">
                Thời gian làm bài:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[3, 5, 10].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimeLimitMinutes(mins)}
                    className={`py-2.5 rounded-2xl text-xs font-black border transition-all duration-200 ${
                      timeLimitMinutes === mins
                        ? 'bg-gradient-to-r from-torii-500 to-rose-600 border-transparent text-white shadow-md shadow-torii-500/25 scale-102'
                        : 'border-stone-200/80 dark:border-white/[0.08] bg-stone-50 dark:bg-white/[0.03] text-stone-700 dark:text-stone-300 hover:border-torii-300'
                    }`}
                  >
                    {mins} phút
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/80 dark:border-white/10 text-xs space-y-1.5 text-stone-500 dark:text-stone-400 font-medium">
              <p className="font-bold text-stone-800 dark:text-stone-200">
                Quy chế thi thử:
              </p>
              <p>• Xen kẽ 50% trắc nghiệm & 50% gõ tiếng Nhật.</p>
              <p>• Trong lúc làm bài thi không hiển thị trước đáp án để đảm bảo tính khách quan.</p>
              <p>• Sau khi nộp bài sẽ có bảng điểm chi tiết kèm giải thích từng câu.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartTest}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-torii-500 via-rose-500 to-amber-500 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-torii-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Bắt Đầu Làm Bài</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH 3: Bảng điểm & Xem lại toàn bộ câu hỏi kèm giải thích và đáp án
  if (isSubmitted) {
    let score = 0;
    const reviewList = testQuestions.map(q => {
      const userAns = (userAnswers[q.id] || '').trim();
      let isCorrect = false;

      if (q.type === 'multiple_choice') {
        isCorrect = userAns === q.correctAnswer;
      } else {
        const targetReading = q.word.reading || q.word.japanese;
        const targetKanji = q.word.japanese;
        const isKata = detectExpectedKanaMode(targetReading) === 'katakana';
        const matchReading = compareJapaneseAnswers(userAns, targetReading, {
          acceptRomaji: settings.acceptRomaji,
          strictKatakana: isKata,
        });
        const matchKanji = compareJapaneseAnswers(userAns, targetKanji, {
          acceptRomaji: settings.acceptRomaji,
          strictKatakana: isKata,
        });
        isCorrect = matchReading || matchKanji;
      }

      if (isCorrect) score++;

      return {
        q,
        userAns,
        isCorrect,
      };
    });

    const percent = Math.round((score / testQuestions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <Award size={40} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
            Kết Quả Bài Thi Thử
          </h2>

          <div className="text-4xl sm:text-5xl font-black font-mono text-torii-600 dark:text-torii-400">
            {score} / {testQuestions.length}{' '}
            <span className="text-base sm:text-lg font-bold text-stone-400">({percent}%)</span>
          </div>

          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium max-w-md mx-auto">
            {percent >= 80
              ? 'Xuất sắc! Bạn đã nắm rất vững kiến thức và phản xạ từ vựng phần này.'
              : percent >= 50
              ? 'Khá tốt! Hãy xem lại các câu sai bên dưới để củng cố thêm nhé.'
              : 'Cần ôn tập thêm! Đừng nản lòng, hãy luyện flashcard và gõ phản xạ đều đặn mỗi ngày.'}
          </p>
        </div>

        {/* Danh sách xem lại từng câu hỏi kèm giải thích */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-stone-800 dark:text-stone-200">
            Chi tiết từng câu hỏi & Giải thích đáp án:
          </h3>

          <div className="space-y-3.5">
            {reviewList.map((item, idx) => (
              <div
                key={item.q.id}
                className={`p-5 rounded-3xl border transition-all backdrop-blur-md ${
                  item.isCorrect
                    ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-400">
                        Câu {idx + 1} ({item.q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Gõ từ'}):
                      </span>
                      <span className="font-jp font-black text-xl text-stone-900 dark:text-stone-100">
                        {item.q.word.japanese}
                      </span>
                      <AudioButton text={item.q.word.japanese} size="sm" />
                    </div>

                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-stone-400">Bạn đã {item.q.type === 'multiple_choice' ? 'chọn' : 'gõ'}: </span>
                        <strong className={item.isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold font-jp'}>
                          {item.userAns || '(Bỏ trống)'}
                        </strong>
                      </p>
                      {!item.isCorrect && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Đáp án đúng: {item.q.word.japanese} [{item.q.word.reading}]
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {item.isCorrect ? (
                      <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={24} className="text-rose-500 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Phần giải thích chi tiết */}
                <div className="mt-3 pt-3 border-t border-stone-200/60 dark:border-white/5 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                  <p>
                    📖 Cách đọc:{' '}
                    <strong className="font-jp text-stone-800 dark:text-stone-200 font-bold">
                      {item.q.word.reading}
                    </strong>
                    {item.q.word.hanViet && ` • Hán Việt: [${item.q.word.hanViet}]`}
                    {` • Nghĩa: ${item.q.word.meaningVi}`}
                  </p>
                  {item.q.word.example && (
                    <p className="italic text-stone-600 dark:text-stone-300">
                      Ví dụ: {item.q.word.example}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleStartTest}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-lg shadow-torii-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Làm đề thi mới</span>
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

  // MÀN HÌNH 2: Đang làm bài thi (KHÔNG LỘ ĐÁP ÁN TRONG LÚC THI)
  const currentQuestion = testQuestions[currentIdx];
  const currentAnswer = userAnswers[currentQuestion.id] || '';
  const isTypingQuestion = currentQuestion.type === 'type_reading';
  const expectedKanaMode = detectExpectedKanaMode(currentQuestion.word.reading || currentQuestion.word.japanese);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Nút Quay Về & Tiêu đề chế độ */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (confirm('Bạn có chắc muốn rời bài thi thử? Kết quả chưa nộp sẽ bị hủy.')) {
              window.location.href = '/study';
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 hover:text-torii-600 dark:hover:text-torii-400 hover:border-torii-400 text-xs font-bold transition-all shadow-sm active:scale-95 group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Quay về Võ Đài</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400">
          <Clock size={14} className="text-amber-500" />
          <span>Thi Thử Tính Giờ</span>
        </div>
      </div>

      {/* Header Giờ làm bài & Nộp bài */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2 font-mono text-base font-black text-torii-600 dark:text-torii-400">
          <Clock size={18} className={secondsRemaining < 60 ? 'animate-bounce text-red-500' : ''} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        <span className="text-xs font-bold text-stone-500">
          Câu {currentIdx + 1} / {testQuestions.length}
        </span>

        <button
          type="button"
          onClick={() => {
            if (confirm('Bạn có chắc muốn nộp bài sớm?')) handleSubmitTest();
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
        >
          Nộp bài
        </button>
      </div>

      {/* Thẻ Câu Hỏi */}
      <div className="p-7 sm:p-9 rounded-[2.5rem] bg-white/90 dark:bg-[#0c1017]/95 backdrop-blur-2xl border-2 border-stone-200/90 dark:border-white/[0.1] shadow-2xl text-center space-y-3.5 relative overflow-hidden">
        <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="text-xs text-stone-400 font-medium relative z-10">
          <span>{currentQuestion.subPrompt}</span>
        </div>

        {/* NỘI DUNG ĐỀ BÀI: Nếu là câu gõ từ thì HIỆN NGHĨA TIẾNG VIỆT TO RÕ */}
        <div className="py-3 relative z-10">
          {isTypingQuestion ? (
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 dark:text-stone-100 leading-tight tracking-tight drop-shadow-sm">
              {currentQuestion.prompt}
            </h2>
          ) : (
            <div className="font-jp text-4xl sm:text-5xl md:text-6xl font-black text-stone-900 dark:text-stone-100 tracking-tight drop-shadow-sm">
              {currentQuestion.prompt}
            </div>
          )}
        </div>

        {currentQuestion.word.hanViet && (
          <div className="relative z-10">
            <span className="inline-block text-xs font-bold text-torii-600 dark:text-torii-400 uppercase tracking-widest px-3 py-1 rounded-full bg-torii-500/10 border border-torii-500/20">
              Hán Việt: [{currentQuestion.word.hanViet}]
            </span>
          </div>
        )}
      </div>

      {/* Vùng Làm Bài: Trắc Nghiệm hoặc Gõ KanaInput */}
      {currentQuestion.type === 'multiple_choice' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {currentQuestion.options?.map((opt, i) => {
            const isChosen = currentAnswer === opt;
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setUserAnswers({ ...userAnswers, [currentQuestion.id]: opt })
                }
                className={`p-4 sm:p-5 rounded-2xl border-2 text-left font-medium text-xs sm:text-sm transition-all duration-200 backdrop-blur-md active:scale-98 ${
                  isChosen
                    ? 'border-torii-500 bg-torii-500/10 text-torii-600 dark:text-torii-300 font-bold shadow-md shadow-torii-500/15'
                    : 'border-stone-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-300 hover:border-torii-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                    isChosen ? 'bg-torii-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                  }`}>
                    {i + 1}
                  </span>
                  <span>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3.5">
          <KanaInput
            ref={inputRef}
            value={currentAnswer}
            onChange={val =>
              setUserAnswers({ ...userAnswers, [currentQuestion.id]: val })
            }
            defaultMode={expectedKanaMode}
            onEnterPress={handleAdvanceNext}
            placeholder={
              expectedKanaMode === 'katakana'
                ? 'Gõ romaji (vd: arubaito -> アルバイト)...'
                : 'Gõ romaji (vd: taberu -> たべる)...'
            }
            inputClassName="text-center font-bold text-xl md:text-2xl tracking-wider"
          />

          <button
            type="button"
            onClick={handleAdvanceNext}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-lg shadow-torii-500/25 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{currentIdx + 1 < testQuestions.length ? 'Lưu & Qua câu tiếp' : 'Hoàn tất bài làm'}</span>
            <kbd className="bg-white/20 text-white border-white/30 hidden sm:inline text-[10px]">Enter ↵</kbd>
          </button>
        </div>
      )}

      {/* Thanh Chuyển Câu */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          className="px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 text-xs font-bold disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-white/5 transition-all"
        >
          ← Câu trước
        </button>

        {currentIdx + 1 < testQuestions.length ? (
          <button
            type="button"
            onClick={() => setCurrentIdx(prev => prev + 1)}
            className="px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-black flex items-center gap-1.5 shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            <span>Câu tiếp theo</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitTest}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            Nộp bài thi ngay
          </button>
        )}
      </div>
    </div>
  );
}
