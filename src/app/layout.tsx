import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Kotoba Dojo (言葉道場) - Học & Ôn Thi Tiếng Nhật Toàn Diện',
  description: 'Web app học và ôn từ vựng, Hán tự, Hiragana, Katakana cho người Việt với SM-2 Spaced Repetition và bộ gõ WanaKana thông minh.',
  keywords: ['tiếng nhật', 'n5', 'n4', 'n3', 'n2', 'n1', 'jlpt', 'học từ vựng', 'kotoba dojo', 'hiragana', 'katakana', 'kanji'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#e14942',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen bg-stone-50 dark:bg-stone-950 font-sans pb-20 md:pb-6">
        <AuthProvider>
          <AppProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 md:py-6">
              {children}
            </main>
            <BottomNav />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

