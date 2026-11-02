'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Flame, Moon, Sun, Volume2, Cloud, User, LogIn, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import { Modal } from './Modal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { settings, updateSettings, stats, syncWithFirebase, isSyncing, lastSyncedText } = useApp();
  const { user, profile, isConfigured, signInGoogle, logOut, saveProfile } = useAuth();

  const [showUserModal, setShowUserModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [classInput, setClassInput] = useState('');

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const openProfile = () => {
    setNameInput(profile?.displayName || user?.displayName || '');
    setClassInput(profile?.className || '');
    setShowUserModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile(nameInput, classInput);
    setShowUserModal(false);
  };

  const navLinks = [
    { href: '/', label: 'Tổng quan' },
    { href: '/kanji', label: 'Hán tự' },
    { href: '/vocabulary', label: 'Bộ từ vựng' },
    { href: '/study', label: 'Luyện tập' },
    { href: '/settings', label: 'Cài đặt' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-[#0b0f17]/85 border-b border-stone-200/70 dark:border-white/[0.08] transition-colors shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-torii-600 via-rose-500 to-amber-500 p-[1.5px] shadow-lg shadow-torii-500/20 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#0c1017] flex items-center justify-center text-torii-500 dark:text-torii-400">
              <span className="font-serif font-black text-xl leading-none">道</span>
            </div>
            {/* Chấm sáng trang trí */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0b0f17]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-torii-500 transition-colors">
                Kotoba<span className="text-torii-500">Dojo</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-torii-500/10 text-torii-600 dark:text-torii-400 font-bold border border-torii-500/20">
                日本語
              </span>
            </div>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 -mt-0.5 hidden sm:block font-medium">
              Võ đường Từ vựng Tiếng Nhật
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-100/70 dark:bg-white/[0.04] p-1 rounded-2xl border border-stone-200/60 dark:border-white/[0.05]">
          {navLinks.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-torii-600 dark:text-torii-400 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-torii-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Chuỗi ngày học Streak */}
          <div
            title={`Chuỗi học: ${stats.streak} ngày liên tục!`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm shadow-amber-500/5 hover:scale-105 transition-transform"
          >
            <Flame size={15} className="fill-amber-500 text-amber-500 animate-bounce" />
            <span>{stats.streak} ngày</span>
          </div>

          {/* Toggle Theme Sáng/Tối */}
          <button
            type="button"
            onClick={toggleTheme}
            title={settings.theme === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng'}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-all active:scale-95 border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
          >
            {settings.theme === 'light' ? (
              <Moon size={18} className="hover:rotate-12 transition-transform" />
            ) : (
              <Sun size={18} className="hover:rotate-45 transition-transform text-amber-400" />
            )}
          </button>

          {/* Firebase Auth & Sync Button */}
          {isConfigured ? (
            user ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={openProfile}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 hover:border-torii-400 transition-all text-xs shadow-sm hover:scale-102"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-torii-400"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-torii-500 to-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {(profile?.displayName || user.displayName || 'U')[0]}
                    </div>
                  )}
                  <span className="font-semibold text-stone-800 dark:text-stone-200 hidden sm:inline max-w-[100px] truncate">
                    {profile?.displayName || user.displayName || 'Võ sinh'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={syncWithFirebase}
                  disabled={isSyncing}
                  title={lastSyncedText ? `Đã đồng bộ lúc ${lastSyncedText}` : 'Đồng bộ dữ liệu lên Cloud Firestore'}
                  className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-torii-500 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors disabled:opacity-50"
                >
                  <Cloud size={18} className={isSyncing ? 'animate-spin text-torii-500' : ''} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={signInGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-torii-500/20 transition-all active:scale-95"
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )
          ) : (
            <Link
              href="/settings"
              title="Dữ liệu đang lưu tự động trong máy (localStorage). Bấm để xem cài đặt Firebase nếu muốn đồng bộ đám mây."
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/15 transition-colors"
            >
              <CheckCircle2 size={13} />
              <span className="hidden xs:inline">Offline OK</span>
            </Link>
          )}
        </div>
      </div>

      {/* Modal hồ sơ học viên */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Hồ sơ Võ sinh Kotoba"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/60 dark:border-white/5">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-12 h-12 rounded-full border border-stone-200 dark:border-stone-700 shadow-sm"
              />
            )}
            <div>
              <p className="text-xs text-stone-400">Email Google đã liên kết</p>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {user?.email}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Họ và tên hiển thị *
            </label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Vd: Nguyễn Văn An"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Lớp / Khóa học (tùy chọn)
            </label>
            <input
              type="text"
              value={classInput}
              onChange={e => setClassInput(e.target.value)}
              placeholder="Vd: N3 K45 hoặc Tiếng Nhật Doanh Nghiệp"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={async () => {
                await logOut();
                setShowUserModal(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-torii-500/25 transition-all"
            >
              Lưu hồ sơ
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
