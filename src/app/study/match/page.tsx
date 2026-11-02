'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { playChime } from '@/lib/sound';
import { Gamepad2, RotateCcw, Clock, Award, Check, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Tile {
  id: string;
  wordId: string;
  text: string;
  type: 'jp' | 'vi';
}

export default function MatchingGamePage() {
  const { studyWords, recordStudyResult } = useApp();

  // Danh sách từ theo bộ giáo trình và chủ đề đã chọn
  const activePool = studyWords;

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedFirst, setSelectedFirst] = useState<Tile | null>(null);
  const [selectedSecond, setSelectedSecond] = useState<Tile | null>(null);
  const [matchedWordIds, setMatchedWordIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Khởi tạo ván chơi mới
  const initGame = () => {
    if (activePool.length < 6) return;

    // Chọn ngẫu nhiên 6 từ
    const sampleWords = [...activePool].sort(() => Math.random() - 0.5).slice(0, 6);

    const generatedTiles: Tile[] = [];
    sampleWords.forEach(w => {
      generatedTiles.push({
        id: `tile_jp_${w.id}`,
        wordId: w.id,
        text: w.japanese,
        type: 'jp',
      });
      generatedTiles.push({
        id: `tile_vi_${w.id}`,
        wordId: w.id,
        text: w.meaningVi,
        type: 'vi',
      });
    });

    // Xáo trộn vị trí các thẻ
    setTiles(generatedTiles.sort(() => Math.random() - 0.5));
    setSelectedFirst(null);
    setSelectedSecond(null);
    setMatchedWordIds([]);
    setMoves(0);
    setTimer(0);
    setIsPlaying(true);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, [activePool]);

  // Bộ đếm thời gian
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isWon) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isWon]);

  // Xử lý khi nhấn vào thẻ
  const handleTileClick = (tile: Tile) => {
    if (matchedWordIds.includes(tile.wordId)) return; // Đã ghép đúng rồi
    if (selectedFirst?.id === tile.id) return; // Nhấn lại chính nó
    if (selectedSecond) return; // Đang trong hiệu ứng kiểm tra

    playChime('click');

    if (!selectedFirst) {
      setSelectedFirst(tile);
    } else {
      setSelectedSecond(tile);
      setMoves(m => m + 1);

      // Kiểm tra có cùng wordId và khác type không
      if (selectedFirst.wordId === tile.wordId && selectedFirst.type !== tile.type) {
        // Đúng cặp!
        playChime('correct');
        const nextMatched = [...matchedWordIds, tile.wordId];
        setMatchedWordIds(nextMatched);

        setTimeout(() => {
          setSelectedFirst(null);
          setSelectedSecond(null);

          // Kiểm tra thắng cuộc (đã ghép hết 6 cặp)
          if (nextMatched.length === 6) {
            setIsWon(true);
            setIsPlaying(false);
            playChime('complete');
            try {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            } catch {}
            recordStudyResult(6, 6);
          }
        }, 400);
      } else {
        // Sai cặp
        playChime('wrong');
        setTimeout(() => {
          setSelectedFirst(null);
          setSelectedSecond(null);
        }, 700);
      }
    }
  };

  if (activePool.length < 6) {
    return (
      <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-4 max-w-md mx-auto shadow-xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">Cần tối thiểu 6 từ vựng!</h2>
        <p className="text-xs text-stone-500 font-medium">
          Chế độ Nối Cặp cần tối thiểu 6 từ vựng để tạo bàn cờ 12 ô. Vui lòng bật thêm bài học ở trang Võ Đài.
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

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Nút Quay Về & Tiêu đề chế độ */}
      <div className="flex items-center justify-between">
        <Link
          href="/study"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-400 text-xs font-bold transition-all shadow-sm active:scale-95 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Quay về Võ Đài</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400">
          <Gamepad2 size={14} className="text-purple-500" />
          <span>Nối Cặp Từ Vựng</span>
        </div>
      </div>

      {/* Top Bar Thời Gian & Số Lượt */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold font-mono">
          <Clock size={18} className="text-purple-500" />
          <span>{timer}s</span>
        </div>

        <div className="text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300">
          Lượt chọn: <span className="text-purple-600 dark:text-purple-400 font-black font-mono">{moves}</span>
        </div>

        <div className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Đã ghép: {matchedWordIds.length} / 6
        </div>
      </div>

      {/* Màn hình chiến thắng */}
      {isWon ? (
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-500/30">
            <Award size={40} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
              Xuất Sắc! Hoàn Thành Ghép Cặp!
            </h2>
            <p className="text-xs text-stone-400 mt-1.5 font-medium">
              Bạn hoàn thành trong <strong className="text-purple-500">{timer} giây</strong> với <strong className="text-purple-500">{moves} lượt chọn</strong>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={initGame}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <RotateCcw size={16} />
              <span>Chơi ván mới</span>
            </button>

            <Link
              href="/study"
              className="px-5 py-3.5 rounded-2xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 font-bold text-sm transition-all"
            >
              Võ Đài
            </Link>
          </div>
        </div>
      ) : (
        /* Lưới 12 ô nối cặp (3 cột x 4 hàng hoặc 4x3) */
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-3.5">
          {tiles.map(tile => {
            const isMatched = matchedWordIds.includes(tile.wordId);
            const isSelected = selectedFirst?.id === tile.id || selectedSecond?.id === tile.id;
            const isError =
              isSelected &&
              selectedSecond !== null &&
              selectedFirst?.wordId !== selectedSecond?.wordId;

            let cardStyle =
              'bg-white/80 dark:bg-stone-900/80 border-stone-200/90 dark:border-white/[0.08] text-stone-800 dark:text-stone-200 hover:border-purple-400 hover:shadow-lg';

            if (isMatched) {
              cardStyle =
                'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 opacity-50 pointer-events-none scale-95';
            } else if (isError) {
              cardStyle =
                'bg-rose-500 border-rose-500 text-white font-bold scale-102 shadow-lg shadow-rose-500/30';
            } else if (isSelected) {
              cardStyle =
                'bg-gradient-to-tr from-purple-600 to-indigo-600 border-transparent text-white font-bold shadow-xl shadow-purple-500/30 scale-102';
            }

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(tile)}
                className={`h-24 sm:h-28 rounded-2xl sm:rounded-3xl border-2 p-2.5 flex flex-col items-center justify-center text-center transition-all duration-200 select-none active:scale-95 backdrop-blur-md ${cardStyle}`}
              >
                <span
                  className={`${
                    tile.type === 'jp'
                      ? 'font-jp text-lg sm:text-xl font-black'
                      : 'text-xs sm:text-sm font-semibold line-clamp-3 leading-snug'
                  }`}
                >
                  {tile.text}
                </span>

                {isMatched && (
                  <Check size={16} className="mt-1 text-emerald-500 stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
