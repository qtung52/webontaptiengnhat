'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getKanjiVocabFiltered, compareHanViet, KanjiVocabItem } from '@/lib/kanji-data';
import { JLPTLevel } from '@/types';
import { KanaInput } from '@/components/KanaInput';
import { Modal } from '@/components/Modal';
import { AudioButton } from '@/components/AudioButton';
import { playChime } from '@/lib/sound';
import { compareJapaneseAnswers } from '@/lib/wanakana-helper';
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  Keyboard,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function KanjiTypingContent() {
  const searchParams = useSearchParams();
  const level = (searchParams.get('level') as JLPTLevel | 'ALL') || 'ALL';
  const topic = searchParams.get('topic') || 'ALL';

  const rawVocabList = useMemo(() => {
    return getKanjiVocabFiltered(level, topic);
  }, [level, topic]);

  // Mode gõ: 'kana' (Gõ cách đọc Hiragana mặc định) hoặc 'hanviet' (Gõ âm Hán Việt)
  const [typingMode, setTypingMode] = useState<'kana' | 'hanviet'>('kana');

  const [cards, setCards] = useState<KanjiVocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeList, setMistakeList] = useState<{ vocab: KanjiVocabItem; userTyped: string }[]>([]);
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [lastMistakeItem, setLastMistakeItem] = useState<{ vocab: KanjiVocabItem; userTyped: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo bài tập
  const restart = useCallback(() => {
    if (rawVocabList.length === 0) return;
    setCards([...rawVocabList].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setUserInput('');
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setMistakeList([]);
    setShowMistakeModal(false);
    setLastMistakeItem(null);
    setIsFinished(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [rawVocabList]);

  useEffect(() => {
    restart();
  }, [restart]);

  const currentItem: KanjiVocabItem | undefined = cards[currentIndex];

  // Kiểm tra đáp án khi người dùng nộp
  const handleSubmit = useCallback(
    (inputOverride?: string) => {
      const textToTest = (inputOverride !== undefined ? inputOverride : userInput).trim();
      if (!textToTest || !currentItem || showMistakeModal) return;

      let isCorrect = false;

      if (typingMode === 'kana') {
        // So sánh cách đọc Kana (Hiragana / Katakana với WanaKana helper đã chuẩn hóa)
        isCorrect = compareJapaneseAnswers(textToTest, currentItem.reading);
      } else {
        // So sánh âm Hán Việt ghép (chấp nhận cả có dấu hoặc không dấu tiếng Việt)
        isCorrect = compareHanViet(textToTest, currentItem.hanViet);
      }

      if (isCorrect) {
        setCorrectCount(c => c + 1);
        setStreak(s => {
          const next = s + 1;
          setMaxStreak(m => Math.max(m, next));
          return next;
        });
        setUserInput('');

        // Chuyển câu tiếp theo
        if (currentIndex + 1 < cards.length) {
          setCurrentIndex(i => i + 1);
          setTimeout(() => inputRef.current?.focus(), 100);
        } else {
          setIsFinished(true);
          playChime('complete');
          try {
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          } catch {}
        }
      } else {
        // Báo sai -> Hiện popup giải thích chi tiết
        setStreak(0);
        const mistakeRecord = { vocab: currentItem, userTyped: textToTest };
        setMistakeList(prev => [...prev, mistakeRecord]);
        setLastMistakeItem(mistakeRecord);
        setShowMistakeModal(true);
      }
    },
    [userInput, currentItem, showMistakeModal, typingMode, currentIndex, cards.length]
  );

  // Đóng modal báo sai và chuyển sang từ tiếp theo
  const handleNextFromModal = useCallback(() => {
    setShowMistakeModal(false);
    setUserInput('');
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(i => i + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsFinished(true);
      playChime('complete');
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }
  }, [currentIndex, cards.length]);

  // Phím Enter khi modal đang mở để qua câu tiếp
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showMistakeModal && e.key === 'Enter') {
        e.preventDefault();
        handleNextFromModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMistakeModal, handleNextFromModal]);

  if (rawVocabList.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4">
        <BookOpen size={48} className="mx-auto text-stone-300 dark:text-stone-600" />
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Không có từ vựng chữ Hán nào theo bộ lọc
        </h2>
        <p className="text-xs text-stone-500">
          Vui lòng chọn cấp độ hoặc bài học khác để bắt đầu luyện gõ.
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
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={`/kanji/study?level=${level}&topic=${encodeURIComponent(topic)}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={15} />
          <span>Võ đài Hán tự</span>
        </Link>

        {/* Toggle Mode Gõ Kana vs Hán Việt */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-200/60 dark:border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTypingMode('kana')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              typingMode === 'kana'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Gõ cách đọc Kana (Furigana)
          </button>
          <button
            type="button"
            onClick={() => setTypingMode('hanviet')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              typingMode === 'hanviet'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Gõ âm Hán Việt (vd: ĐẠI HỌC)
          </button>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
          <Flame size={14} className={streak > 1 ? 'animate-bounce text-orange-500' : ''} />
          <span>Streak {streak}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-stone-400">
          <span>Từ {currentIndex + 1} / {cards.length}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-stone-200/70 dark:bg-stone-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Kết Quả Khi Hoàn Thành */}
      {isFinished ? (
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-6 shadow-xl animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
            <Award size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
              Hoàn Thành Luyện Gõ Từ Vựng Chữ Hán!
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Đã gõ chính xác {correctCount} / {cards.length} từ vựng chữ Hán.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <span className="text-2xl font-black block">{correctCount}</span>
              <span className="text-[11px] font-bold">Số từ đúng</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <span className="text-2xl font-black block">{maxStreak}</span>
              <span className="text-[11px] font-bold">Chuỗi kỷ lục</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl font-black block">
                {Math.round((correctCount / cards.length) * 100)}%
              </span>
              <span className="text-[11px] font-bold">Độ chính xác</span>
            </div>
          </div>

          {/* Danh sách lỗi gõ sai */}
          {mistakeList.length > 0 && (
            <div className="text-left space-y-2 max-w-md mx-auto p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                Các từ đã gõ sai ({mistakeList.length} từ):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {mistakeList.map((m, idx) => (
                  <div
                    key={idx}
                    className="text-xs flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/50 dark:border-white/5"
                  >
                    <div>
                      <span className="font-jp font-black text-base text-stone-900 dark:text-stone-100">
                        {m.vocab.word}
                      </span>
                      <span className="text-torii-500 font-jp font-bold ml-2">
                        [{m.vocab.reading}]
                      </span>
                      <p className="text-stone-400 text-[11px]">{m.vocab.meaningVi}</p>
                    </div>
                    <span className="text-rose-500 font-medium text-right">
                      Bạn gõ: "{m.userTyped}"
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={restart}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              Luyện lại toàn bộ
            </button>
            <Link
              href={`/kanji/study/flashcard?level=${level}&topic=${encodeURIComponent(topic)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all"
            >
              Sang Flashcard từ vựng →
            </Link>
          </div>
        </div>
      ) : currentItem ? (
        /* Thẻ Đề Bài Gõ */
        <div className="space-y-4">
          <div className="p-7 sm:p-9 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm text-center space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {currentItem.level}
              </span>
              <span className="truncate max-w-[200px]">{currentItem.topic}</span>
            </div>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">
              {typingMode === 'kana'
                ? `Nhập cách đọc Hiragana của từ vựng chữ Hán này (Nghĩa: ${currentItem.meaningVi})`
                : `Nhập âm Hán Việt tương ứng của từ vựng này (Nghĩa: ${currentItem.meaningVi})`}
            </p>

            {/* Từ vựng chữ Hán to rõ */}
            <div className="py-2">
              <span className="font-jp text-6xl sm:text-8xl font-black text-stone-900 dark:text-stone-100 drop-shadow-sm inline-block">
                {currentItem.word}
              </span>
            </div>

            {/* Chi tiết Hán tự cấu thành */}
            {currentItem.notes && currentItem.notes.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {currentItem.notes.map((n, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-white/5 border border-stone-200/60 dark:border-white/5 text-stone-600 dark:text-stone-300 font-medium"
                  >
                    <strong className="font-jp font-bold text-stone-800 dark:text-stone-100">{n.kanji}</strong>: {n.hanViet}
                  </span>
                ))}
              </div>
            )}

            {/* Audio Button */}
            <div className="flex justify-center pt-1">
              <AudioButton text={currentItem.word} size="sm" />
            </div>
          </div>

          {/* Ô Nhập Liệu */}
          <div className="space-y-2">
            {typingMode === 'kana' ? (
              <KanaInput
                ref={inputRef}
                value={userInput}
                onChange={setUserInput}
                onEnterPress={() => handleSubmit()}
                placeholder="Gõ Romaji (vd: daigaku -> だいがく) rồi bấm Enter ↵"
                autoFocus
              />
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="relative"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Gõ âm Hán Việt (ví dụ: DAI HOC hoặc ĐẠI HỌC) rồi bấm Enter ↵"
                  autoFocus
                  className="w-full text-center text-lg sm:text-xl font-bold py-4 px-6 rounded-2xl bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-white/10 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm uppercase"
                />
              </form>
            )}

            <div className="flex items-center justify-between text-[11px] text-stone-400 px-2 font-medium">
              <span>Mẹo: Gõ bằng Romaji bàn phím thường, hệ thống tự động đổi Hiragana</span>
              <button
                type="button"
                onClick={() => handleSubmit('__SKIP__')}
                className="text-stone-500 hover:text-torii-500 transition-colors"
              >
                Không nhớ (Xem đáp án)
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Báo Sai Obsidian Cực Đẹp */}
      <Modal
        isOpen={showMistakeModal}
        onClose={handleNextFromModal}
        maxWidth="md"
      >
        {lastMistakeItem && (
          <div className="text-center space-y-5 animate-scale-in">
            {/* Icon lỗi */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <XCircle size={32} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-rose-500">
                Chưa chính xác!
              </h3>
              <p className="text-xs text-stone-400">
                Bạn đã nhập:{' '}
                <span className="font-bold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25">
                  "{lastMistakeItem.userTyped}"
                </span>
              </p>
            </div>

            {/* Hộp Đáp Án Chuẩn */}
            <div className="p-5 rounded-2xl bg-stone-900/60 dark:bg-black/40 border border-stone-200/20 dark:border-white/10 space-y-3">
              <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                ✓ ĐÁP ÁN CHUẨN CỦA TỪ NÀY:
              </span>

              <div className="flex items-center justify-center gap-3">
                <span className="font-jp text-5xl font-black text-stone-100">
                  {lastMistakeItem.vocab.word}
                </span>
                <AudioButton text={lastMistakeItem.vocab.word} size="md" />
              </div>

              <div className="space-y-1">
                <p className="text-xl font-black text-emerald-400 font-jp">
                  {lastMistakeItem.vocab.reading}
                </p>
                <p className="text-sm font-bold text-torii-400 uppercase tracking-wide">
                  Hán Việt: {lastMistakeItem.vocab.hanViet}
                </p>
                <p className="text-xs font-semibold text-stone-300">
                  Nghĩa: {lastMistakeItem.vocab.meaningVi}
                </p>
              </div>

              {/* Chi tiết từng chữ Hán */}
              {lastMistakeItem.vocab.notes && lastMistakeItem.vocab.notes.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                    Cấu tạo chữ Hán:
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {lastMistakeItem.vocab.notes.map((n, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 text-stone-300"
                      >
                        <strong className="font-jp text-stone-100">{n.kanji}</strong> ({n.hanViet}): {n.meaningVi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Nút Tiếp Tục */}
            <button
              type="button"
              onClick={handleNextFromModal}
              autoFocus
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-torii-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            >
              <span>Tiếp tục từ tiếp theo</span>
              <span className="text-xs opacity-80 font-normal">(Nhấn Enter ↵)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function KanjiTypingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Đang chuẩn bị phòng luyện gõ từ vựng...</div>}>
      <KanjiTypingContent />
    </Suspense>
  );
}
