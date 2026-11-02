'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Layers, Dumbbell, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Tổng quan', icon: Home },
    { href: '/kanji', label: 'Hán tự', icon: BookOpen },
    { href: '/vocabulary', label: 'Bộ từ', icon: Layers },
    { href: '/study', label: 'Ôn tập', icon: Dumbbell },
    { href: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-[#0b0f17]/90 border-t border-stone-200/70 dark:border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe transition-colors">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive
                  ? 'text-torii-500 dark:text-torii-400 font-bold'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-torii-500/10 dark:bg-torii-500/20 scale-110 shadow-sm'
                    : 'hover:bg-stone-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-torii-500 shadow-sm shadow-torii-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
