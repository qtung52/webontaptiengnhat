'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as wanakana from 'wanakana';
import { useApp } from '@/context/AppContext';
import { KanaInputMode } from '@/lib/wanakana-helper';

export interface KanaInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  defaultMode?: KanaInputMode;
  onEnterPress?: () => void;
  showModeToggle?: boolean;
  inputClassName?: string;
}

export const KanaInput = forwardRef<HTMLInputElement, KanaInputProps>(
  (
    {
      value,
      onChange,
      defaultMode = 'hiragana',
      onEnterPress,
      showModeToggle = true,
      inputClassName = '',
      placeholder = 'Gõ romaji (vd: taberu -> たべる)...',
      disabled,
      ...props
    },
    ref
  ) => {
    const { settings } = useApp();
    const [mode, setMode] = useState<KanaInputMode>(defaultMode);
    const internalInputRef = useRef<HTMLInputElement>(null);
    const isComposingRef = useRef(false);

    useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);

    // Cập nhật mode nếu defaultMode bên ngoài thay đổi (ví dụ chuyển câu hỏi Katakana)
    useEffect(() => {
      setMode(defaultMode);
    }, [defaultMode]);

    // Lắng nghe phím tắt F6 (Hiragana), F7 (Katakana), F9 (Romaji)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F6') {
          e.preventDefault();
          setMode('hiragana');
        } else if (e.key === 'F7') {
          e.preventDefault();
          setMode('katakana');
        } else if (e.key === 'F9') {
          e.preventDefault();
          setMode('romaji');
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Nếu đang trong quá trình gõ IME thực sự (bộ gõ tiếng Nhật của hệ điều hành), không can thiệp
      if (isComposingRef.current) {
        onChange(e.target.value);
        return;
      }

      const rawVal = e.target.value;
      const target = e.target;
      const cursorEnd = target.selectionEnd || 0;

      if (!settings.autoConvertKana || mode === 'romaji') {
        onChange(rawVal);
        return;
      }

      // Nếu người dùng đang gõ ký tự in hoa tiếng Anh / số thuần túy (e.g. ATM, CD, DVD, 100):
      // Giữ nguyên chuỗi, không ép WanaKana biến thành Kana lạ như "あtm" hay "アtM"
      if (/^[A-Z0-9\s~～\-_.]+$/.test(rawVal)) {
        onChange(rawVal);
        return;
      }

      // Chuyển đổi Romaji -> Kana bằng WanaKana thuần React
      // IMEMode: true hỗ trợ gõ liên tục: kka -> っか, si/shi -> し, n' / nn -> ん
      let converted = rawVal;
      if (mode === 'katakana') {
        converted = wanakana.toKana(rawVal, { IMEMode: 'toKatakana' });
      } else {
        converted = wanakana.toKana(rawVal, { IMEMode: true });
      }

      onChange(converted);

      // Căn chỉnh vị trí con trỏ nếu người dùng sửa ở giữa chuỗi
      if (cursorEnd < rawVal.length) {
        const diff = converted.length - rawVal.length;
        const newPos = Math.max(0, cursorEnd + diff);
        requestAnimationFrame(() => {
          if (internalInputRef.current) {
            internalInputRef.current.setSelectionRange(newPos, newPos);
          }
        });
      }
    };

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      const target = e.target as HTMLInputElement;
      let val = target.value;
      if (settings.autoConvertKana && mode !== 'romaji') {
        if (!/^[A-Z0-9\s~～\-_.]+$/.test(val)) {
          if (mode === 'katakana') {
            val = wanakana.toKana(val, { IMEMode: 'toKatakana' });
          } else {
            val = wanakana.toKana(val, { IMEMode: true });
          }
        }
      }
      onChange(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isComposingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
          e.nativeEvent.stopImmediatePropagation();
        }
        // Hoàn tất chữ 'n' cuối từ thành ん / ン nếu có
        if (settings.autoConvertKana && mode !== 'romaji' && /[nN]$/.test(value)) {
          const finalized =
            mode === 'katakana' ? wanakana.toKatakana(value) : wanakana.toHiragana(value);
          onChange(finalized);
        }
        onEnterPress?.();
      }
    };

    return (
      <div className="relative w-full">
        <div className="flex items-center rounded-3xl border-2 border-stone-200/90 dark:border-white/[0.12] bg-white/90 dark:bg-[#0c1017]/95 backdrop-blur-xl focus-within:border-torii-500 dark:focus-within:border-torii-500 focus-within:ring-4 focus-within:ring-torii-500/20 shadow-xl transition-all duration-300 overflow-hidden">
          <input
            ref={internalInputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            lang="ja"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className={`w-full px-5 py-3.5 text-lg sm:text-xl font-jp bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none ${inputClassName}`}
            {...props}
          />

          {showModeToggle && (
            <div className="flex items-center gap-1.5 pr-3 shrink-0">
              <button
                type="button"
                onClick={() => setMode('hiragana')}
                title="Bật gõ Hiragana (Phím tắt: F6)"
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                  mode === 'hiragana'
                    ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/30'
                    : 'bg-stone-100 dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                あ Hira
              </button>

              <button
                type="button"
                onClick={() => setMode('katakana')}
                title="Bật gõ Katakana (Phím tắt: F7)"
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                  mode === 'katakana'
                    ? 'bg-gradient-to-r from-torii-500 to-rose-600 text-white shadow-md shadow-torii-500/30'
                    : 'bg-stone-100 dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                ア Kata
              </button>

              <button
                type="button"
                onClick={() => setMode('romaji')}
                title="Bật gõ Romaji thuần (Phím tắt: F9)"
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                  mode === 'romaji'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
                    : 'bg-stone-100 dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                Aa
              </button>
            </div>
          )}
        </div>

        {/* Chú thích nhỏ cho phím tắt trên desktop */}
        <div className="hidden sm:flex items-center justify-between mt-2 text-[11px] text-stone-400 dark:text-stone-500 px-2 font-medium">
          <span>Gõ romaji tự chuyển sang Kana</span>
          <div className="flex items-center gap-2">
            <span><kbd>F6</kbd> Hiragana</span>
            <span>•</span>
            <span><kbd>F7</kbd> Katakana</span>
            <span>•</span>
            <span><kbd>F9</kbd> Romaji</span>
          </div>
        </div>
      </div>
    );
  }
);

KanaInput.displayName = 'KanaInput';
