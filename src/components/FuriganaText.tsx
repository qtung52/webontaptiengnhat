'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

interface FuriganaTextProps {
  japanese: string;
  reading?: string;
  className?: string;
  furiganaClassName?: string;
}

export const FuriganaText: React.FC<FuriganaTextProps> = ({
  japanese,
  reading,
  className = '',
  furiganaClassName = '',
}) => {
  const { settings } = useApp();

  // Nếu không có reading riêng hoặc reading giống hệt japanese (thuần kana)
  if (!reading || reading === japanese) {
    return <span className={className}>{japanese}</span>;
  }

  // Nếu tắt furigana trong cài đặt
  if (!settings.furigana) {
    return <span className={className}>{japanese}</span>;
  }

  return (
    <ruby className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="leading-tight">{japanese}</span>
      <rp>(</rp>
      <rt className={`text-[0.55em] font-medium text-torii-600 dark:text-torii-400 select-none ${furiganaClassName}`}>
        {reading}
      </rt>
      <rp>)</rp>
    </ruby>
  );
};

