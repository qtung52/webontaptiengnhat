'use client';

import React, { useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Volume2,
  Type,
  Download,
  Upload,
  Cloud,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Keyboard,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    exportAllData,
    importAllData,
    syncWithFirebase,
    isSyncing,
    lastSyncedText,
    decks,
    words,
  } = useApp();

  const { user, profile, isConfigured, signInGoogle, logOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Xử lý xuất file sao lưu
  const handleExportBackup = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kotoba_dojo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Xử lý nạp file sao lưu
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const res = importAllData(content);
        if (res.success) {
          alert('Khôi phục dữ liệu sao lưu thành công!');
        } else {
          alert('Lỗi: ' + res.message);
        }
      } catch (err) {
        alert('Lỗi đọc file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-7 animate-fade-in">
      {/* Header */}
      <div className="p-6 sm:p-7 rounded-[2rem] bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Cài Đặt Hệ Thống
          </h1>
          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-gradient-to-tr from-torii-500 to-rose-500 text-white shadow-sm shadow-torii-500/20">
            設定
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
          Tùy biến hiển thị furigana, bộ gõ WanaKana, sao lưu dữ liệu và đồng bộ đám mây
        </p>
      </div>

      {/* 1. Giao diện & Hiển thị */}
      <section className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center">
            <Type size={18} />
          </div>
          <span>Giao diện & Hiển thị</span>
        </h2>

        <div className="space-y-4 divide-y divide-stone-100 dark:divide-white/5 text-xs sm:text-sm">
          {/* Theme sáng / tối */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-200">
                Chế độ Giao diện
              </p>
              <p className="text-stone-400 text-xs mt-0.5 font-medium">Chuyển đổi giao diện Sáng / Tối phong cách Zen</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })
              }
              className="px-4 py-2 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-white/[0.04] font-bold text-xs flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              {settings.theme === 'light' ? (
                <>
                  <Sun size={15} className="text-amber-500" /> Sáng
                </>
              ) : (
                <>
                  <Moon size={15} className="text-indigo-400" /> Tối
                </>
              )}
            </button>
          </div>

          {/* Bật / Tắt Furigana */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-200">
                Hiển thị Furigana (Cách đọc trên chữ Hán)
              </p>
              <p className="text-stone-400 text-xs mt-0.5 font-medium">
                Tắt nếu bạn muốn tự kiểm tra trí nhớ khi nhìn Kanji
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.furigana}
              onChange={e => updateSettings({ furigana: e.target.checked })}
              className="w-5 h-5 rounded-lg text-torii-600 focus:ring-torii-500 cursor-pointer accent-torii-500"
            />
          </div>
        </div>
      </section>

      {/* 2. Cài Đặt Bộ Gõ WanaKana IME & Chấm Điểm */}
      <section className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center">
            <Keyboard size={18} />
          </div>
          <span>Bộ Gõ Thông Minh WanaKana (Romaji → Kana)</span>
        </h2>

        <div className="space-y-4 divide-y divide-stone-100 dark:divide-white/5 text-xs sm:text-sm">
          {/* Tự chuyển Kana */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-200">
                Tự động chuyển Romaji sang Hiragana/Katakana
              </p>
              <p className="text-stone-400 text-xs mt-0.5 font-medium max-w-md">
                Gõ &quot;konnichiwa&quot; tự hiện &quot;こんにちは&quot; ngay trong ô nhập mà không cần cài bộ gõ tiếng Nhật của máy tính
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoConvertKana}
              onChange={e => updateSettings({ autoConvertKana: e.target.checked })}
              className="w-5 h-5 rounded-lg text-torii-600 focus:ring-torii-500 cursor-pointer accent-torii-500"
            />
          </div>

          {/* Chấp nhận Romaji thuần khi chấm */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-200">
                Chấp nhận đáp án Romaji thuần khi chấm điểm
              </p>
              <p className="text-stone-400 text-xs mt-0.5 font-medium max-w-md">
                Khi bạn gõ &quot;taberu&quot; hoặc &quot;たべる&quot; đều được tính đúng (chuẩn hóa âm đệm, trường âm và gạch ngang)
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.acceptRomaji}
              onChange={e => updateSettings({ acceptRomaji: e.target.checked })}
              className="w-5 h-5 rounded-lg text-torii-600 focus:ring-torii-500 cursor-pointer accent-torii-500"
            />
          </div>
        </div>
      </section>

      {/* 3. Phát Âm Tiếng Nhật ja-JP */}
      <section className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center">
            <Volume2 size={18} />
          </div>
          <span>Giọng Đọc Phát Âm Tiếng Nhật (Web Speech API)</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-200">
                Tốc độ phát âm ({settings.speechSpeed}x)
              </p>
              <p className="text-stone-400 text-xs mt-0.5 font-medium">Điều chỉnh tốc độ đọc khi bấm nút phát âm mẫu</p>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.2"
              step="0.1"
              value={settings.speechSpeed}
              onChange={e => updateSettings({ speechSpeed: parseFloat(e.target.value) })}
              className="w-32 accent-torii-500 cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* 4. Sao Lưu & Phục Hồi Dữ Liệu (Offline JSON) */}
      <section className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <span>Sao Lưu & Phục Hồi Dữ Liệu Cục Bộ</span>
        </h2>

        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
          Hiện có <strong>{decks.length} bộ giáo trình</strong> và <strong>{words.length} từ vựng</strong> đang được lưu trữ an toàn trong trình duyệt (localStorage).
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-5 py-3 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black text-xs shadow-md hover:opacity-90 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Download size={15} />
            <span>Xuất toàn bộ file sao lưu (.json)</span>
          </button>

          <label className="px-5 py-3 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-white/[0.04] text-stone-800 dark:text-stone-200 font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95">
            <Upload size={15} />
            <span>Khôi phục từ file JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* 5. Tùy Chọn Đăng Nhập & Đồng Bộ Firebase */}
      <section className="p-6 sm:p-7 rounded-[2rem] bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-torii-500/10 text-torii-500 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <span>Đồng Bộ Đám Mây Firebase (Tùy chọn)</span>
          </h2>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              isConfigured
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-stone-100 text-stone-500 dark:bg-white/5'
            }`}
          >
            {isConfigured ? 'Firebase Sẵn Sàng' : 'Chưa cấu hình .env'}
          </span>
        </div>

        {isConfigured ? (
          <div className="space-y-4">
            {user ? (
              <div className="p-5 rounded-2xl bg-stone-50/80 dark:bg-white/[0.03] border border-stone-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 shadow-sm"
                      />
                    )}
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {profile?.displayName || user.displayName}
                      </p>
                      <p className="text-[11px] text-stone-400">{user.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={logOut}
                    className="text-xs text-rose-500 font-bold hover:underline"
                  >
                    Đăng xuất
                  </button>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-stone-200/60 dark:border-white/5">
                  <span className="text-[11px] text-stone-400 font-medium">
                    {lastSyncedText ? `Đồng bộ lần cuối: ${lastSyncedText}` : 'Chưa đồng bộ lần nào'}
                  </span>

                  <button
                    type="button"
                    onClick={syncWithFirebase}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-torii-500/25 flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Đang tải lên...' : 'Đồng bộ ngay'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
                  Đăng nhập bằng tài khoản Google để lưu trữ bộ từ và tiến độ học tập trên Cloud Firestore, đồng bộ tức thì giữa điện thoại và máy tính.
                </p>
                <button
                  type="button"
                  onClick={signInGoogle}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-torii-500 to-rose-600 hover:from-torii-600 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-torii-500/25 transition-all active:scale-95"
                >
                  Đăng nhập bằng Google
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-xs text-stone-500 dark:text-stone-400 leading-relaxed bg-stone-50/80 dark:bg-white/[0.03] p-5 rounded-2xl border border-stone-200/80 dark:border-white/10 font-medium">
            <p className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <span>Web app đang hoạt động 100% độc lập không cần đăng nhập!</span>
            </p>
            <p>
              Tất cả dữ liệu từ vựng, flashcard và chuỗi ngày học của bạn được lưu an toàn trên máy qua <code>localStorage</code>.
            </p>
            <p className="text-[11px] text-stone-400">
              Nếu bạn muốn bật đồng bộ đám mây và đăng nhập Gmail: chỉ cần điền cấu hình vào file <code>.env.local</code> theo mẫu trong file <code>.env.example</code> và khởi động lại app.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
