'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakJapanese } from '@/lib/sound';
import { useApp } from '@/context/AppContext';

interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  size = 'md',
  className = '',
  title = 'Phát âm tiếng Nhật',
}) => {
  const { settings } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    speakJapanese(text, settings?.speechSpeed || 0.9);

    setTimeout(() => {
      setIsPlaying(false);
    }, 1200);
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 17,
    lg: 22,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`rounded-2xl transition-all duration-200 flex items-center justify-center border active:scale-90 cursor-pointer ${
        isPlaying
          ? 'bg-torii-500 text-white border-transparent shadow-lg shadow-torii-500/30 scale-105'
          : 'bg-white/80 dark:bg-stone-800/80 hover:bg-torii-500/10 dark:hover:bg-torii-500/20 text-stone-600 dark:text-stone-300 hover:text-torii-600 dark:hover:text-torii-400 border-stone-200/80 dark:border-white/10 hover:border-torii-400/50 shadow-sm'
      } ${sizeClasses[size]} ${className}`}
    >
      <Volume2
        size={iconSizes[size]}
        className={isPlaying ? 'animate-pulse' : ''}
      />
    </button>
  );
};
