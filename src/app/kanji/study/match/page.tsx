'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getKanjiVocabFiltered, KanjiVocabItem } from '@/lib/kanji-data';
import { JLPTLevel } from '@/types';
import { playChime } from '@/lib/sound';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Gamepad2,
  Clock,
  Award,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchCard {
  cardId: string;
  vocabId: string;
  type: 'word' | 'readingMeaning';
  text: string;
  subText?: string;
  isMatched: boolean;
}

function KanjiMatchContent() {
  const searchParams = useSearchParams();
  const level = (searchParams.get('level') as JLPTLevel | 'ALL') || 'ALL';
  const topic = searchParams.get('topic') || 'ALL';

  const rawVocabList = useMemo(() => {
    return getKanjiVocabFiltered(level, topic);
  }, [level, topic]);

  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [round, setRound] = useState(1);

  // Khởi tạo một ván chơi (chọn 6 từ vựng chữ Hán ngẫu nhiên -> 12 thẻ)
  const initBoard = useCallback(() => {
    if (rawVocabList.length < 2) return;

    // Chọn tối đa 6 từ vựng ngẫu nhiên
    const shuffledVocab = [...rawVocabList].sort(() => Math.random() - 0.5).slice(0, 6);
    const generatedCards: MatchCard[] = [];

    shuffledVocab.forEach(item => {
      // Thẻ từ chữ Hán
      generatedCards.push({
        cardId: `word_${item.id}`,
        vocabId: item.id,
        type: 'word',
        text: item.word,
        isMatched: false,
      });

      // Thẻ Cách đọc + Nghĩa
      generatedCards.push({
        cardId: `rm_${item.id}`,
        vocabId: item.id,
        type: 'readingMeaning',
        text: item.reading,
        subText: item.meaningVi,
        isMatched: false,
      });
    });

    // Xáo trộn vị trí 12 thẻ
    setCards(generatedCards.sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setMoves(0);
    setSeconds(0);
    setTimerRunning(true);
    setIsVictory(false);
  }, [rawVocabList]);

  useEffect(() => {
    initBoard();
  }, [initBoard, round]);

  // Bộ đếm thời gian
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Xử lý khi nhấn vào thẻ
  const handleCardClick = (card: MatchCard) => {
    if (!timerRunning || card.isMatched || selectedCards.length >= 2) return;
    if (selectedCards.some(c => c.cardId === card.cardId)) return;

    playChime('click');
    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newSelected;

      // Kiểm tra có cùng vocabId và khác loại không
      if (first.vocabId === second.vocabId && first.type !== second.type) {
        // Đúng cặp!
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.vocabId === first.vocabId ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);

          // Kiểm tra xem đã ghép hết chưa
          setCards(latest => {
            const allMatched = latest.every(c => c.isMatched || c.vocabId === first.vocabId);
            if (allMatched) {
              setTimerRunning(false);
              setIsVictory(true);
              playChime('complete');
              try {
                confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
              } catch {}
            }
            return latest;
          });
        }, 300);
      } else {
        // Sai cặp -> lật lại sau 700ms
        setTimeout(() => {
          setSelectedCards([]);
        }, 700);
      }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (rawVocabList.length < 2) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4">
        <BookOpen size={48} className="mx-auto text-stone-300 dark:text-stone-600" />
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Cần ít nhất 2 từ vựng để chơi ghép cặp
        </h2>
        <p className="text-xs text-stone-500">
          Vui lòng chọn cấp độ hoặc bài học có nhiều từ vựng hơn.
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

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/kanji/study?level=${level}&topic=${encodeURIComponent(topic)}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={15} />
          <span>Võ đài Hán tự</span>
        </Link>

        {/* Timer & Moves */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-black">
            <Clock size={14} />
            <span>{formatTime(seconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200/60 dark:border-white/10 text-stone-600 dark:text-stone-400 text-xs font-black">
            <span>{moves} lượt ghép</span>
          </div>

          <button
            type="button"
            onClick={initBoard}
            title="Làm mới bàn cờ"
            className="p-2 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-white/[0.08] text-stone-500 hover:text-purple-600 transition-colors shadow-sm active:scale-95"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Thông báo chiến thắng */}
      {isVictory ? (
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-6 shadow-xl animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25">
            <Award size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
              Chiến Thắng! Ghép Đôi Hoàn Hảo!
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Bạn đã hoàn thành ghép cả 6 cặp từ vựng chữ Hán chỉ trong {formatTime(seconds)} với {moves} lượt ghép.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
              <span className="text-2xl font-black block">{formatTime(seconds)}</span>
              <span className="text-xs font-bold">Thời gian</span>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <span className="text-2xl font-black block">{moves}</span>
              <span className="text-xs font-bold">Số lượt ghép</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRound(r => r + 1)}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all"
            >
              Chơi ván mới (Bộ từ khác)
            </button>
            <Link
              href={`/kanji/study/typing?level=${level}&topic=${encodeURIComponent(topic)}`}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              Sang Luyện gõ từ vựng →
            </Link>
          </div>
        </div>
      ) : (
        /* Bàn Cờ Ghép Thẻ 12 Ô */
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
          {cards.map(card => {
            const isSelected = selectedCards.some(c => c.cardId === card.cardId);
            const isMatched = card.isMatched;

            let cardStyle =
              'bg-white/80 dark:bg-stone-900/80 border-stone-200/80 dark:border-white/[0.08] hover:border-purple-500/40 hover:-translate-y-0.5 shadow-sm text-stone-800 dark:text-stone-200';

            if (isMatched) {
              cardStyle =
                'opacity-0 pointer-events-none scale-90 transition-all duration-500';
            } else if (isSelected) {
              cardStyle =
                'bg-purple-500 text-white border-purple-500 shadow-xl shadow-purple-500/30 scale-105';
            }

            return (
              <div
                key={card.cardId}
                onClick={() => handleCardClick(card)}
                className={`min-h-[110px] sm:min-h-[130px] p-3 sm:p-4 rounded-[2rem] border backdrop-blur-xl flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 active:scale-95 ${cardStyle}`}
              >
                {card.type === 'word' ? (
                  <span
                    className={`font-jp text-2xl sm:text-3xl font-black ${
                      isSelected ? 'text-white' : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {card.text}
                  </span>
                ) : (
                  <div className="space-y-1">
                    <span
                      className={`text-sm sm:text-base font-black font-jp block ${
                        isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {card.text}
                    </span>
                    {card.subText && (
                      <span
                        className={`text-[11px] block line-clamp-2 font-medium ${
                          isSelected ? 'text-purple-100' : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {card.subText}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KanjiMatchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Đang chuẩn bị bàn cờ nối cặp...</div>}>
      <KanjiMatchContent />
    </Suspense>
  );
}
