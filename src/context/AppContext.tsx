'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Deck, VocabWord, AppSettings, UserStats } from '@/types';
import { getLocalStorage, setLocalStorage } from '@/lib/storage';
import manabimanVocabData from '@/data/manabiman-vocab.json';
import manabimanDecksData from '@/data/manabiman-decks.json';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AppContextType {
  // Bộ từ & Từ vựng
  decks: Deck[];
  words: VocabWord[];
  activeDeckIds: string[];
  setActiveDeckIds: (ids: string[]) => void;
  toggleActiveDeck: (id: string) => void;
  activeTopics: string[];
  setActiveTopics: (topics: string[]) => void;
  toggleActiveTopic: (topic: string) => void;
  selectAllTopics: () => void;
  clearAllTopics: () => void;
  studyWords: VocabWord[];
  addDeck: (title: string, description?: string, level?: Deck['level']) => Deck;
  updateDeck: (id: string, updates: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;
  addWord: (word: Omit<VocabWord, 'id' | 'createdAt'>) => VocabWord;
  addWordsBulk: (newWords: Partial<VocabWord>[], deckId: string) => number;
  updateWord: (id: string, updates: Partial<VocabWord>) => void;
  deleteWord: (id: string) => void;
  toggleWordMastered: (id: string, mastered?: boolean) => void;
  updateWordSRS: (id: string, grade: number) => void;
  resetDeckSRS: (deckId: string) => void;

  // Cài đặt & Thống kê
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  stats: UserStats;
  recordStudyResult: (correctCount: number, totalCount: number) => void;

  // Sao lưu / Phục hồi / Đồng bộ
  exportAllData: () => string;
  importAllData: (jsonData: string) => { success: boolean; message: string };
  syncWithFirebase: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedText: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  furigana: true,
  autoConvertKana: true,
  acceptRomaji: true,
  soundEnabled: true,
  theme: 'light',
  speechSpeed: 0.9,
};

const DEFAULT_STATS: UserStats = {
  streak: 0,
  lastStudyDate: '',
  totalMastered: 0,
  history: {},
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>(['deck-jpd113', 'deck-jpd123', 'deck-jpd133']);
  const [activeTopics, setActiveTopics] = useState<string[]>(['ALL']);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedText, setLastSyncedText] = useState('');

  // 1. Khởi tạo dữ liệu từ localStorage hoặc dữ liệu gốc Manabiman
  useEffect(() => {
    const savedDecks = getLocalStorage<Deck[]>('kotoba_decks', []);
    const savedWords = getLocalStorage<VocabWord[]>('kotoba_words', []);
    const savedSettings = getLocalStorage<AppSettings>('kotoba_settings', DEFAULT_SETTINGS);
    const savedStats = getLocalStorage<UserStats>('kotoba_stats', DEFAULT_STATS);
    const savedActiveTopics = getLocalStorage<string[]>('kotoba_active_topics', ['ALL']);
    setActiveTopics(savedActiveTopics.length > 0 ? savedActiveTopics : ['ALL']);

    const hasOldSample = savedDecks.some(d => d.id === 'deck-n5-sample');

    // Nếu chưa có bộ từ hoặc còn lưu bộ từ mẫu cũ, khởi tạo bộ từ Manabiman (805 từ, JPD113, JPD123, JPD133)
    if (savedDecks.length === 0 || hasOldSample) {
      const initialDecks = manabimanDecksData as Deck[];
      const initialWords = manabimanVocabData as VocabWord[];
      const initialActiveIds = ['deck-jpd113', 'deck-jpd123', 'deck-jpd133'];

      setDecks(initialDecks);
      setWords(initialWords);
      setActiveDeckIds(initialActiveIds);
      setLocalStorage('kotoba_decks', initialDecks);
      setLocalStorage('kotoba_words', initialWords);
    } else {
      setDecks(savedDecks);
      setWords(savedWords);
      setActiveDeckIds(savedDecks.map(d => d.id));
    }

    setSettings(savedSettings);
    setStats(savedStats);

    // Áp dụng theme dark/light vào html document
    if (savedSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setIsLoaded(true);
  }, []);

  // 2. Lưu vào localStorage khi state thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    setLocalStorage('kotoba_decks', decks);
  }, [decks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    setLocalStorage('kotoba_words', words);
  }, [words, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    setLocalStorage('kotoba_active_topics', activeTopics);
  }, [activeTopics, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    setLocalStorage('kotoba_settings', settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    setLocalStorage('kotoba_stats', stats);
  }, [stats, isLoaded]);

  // Bộ từ CRUD
  const addDeck = (title: string, description?: string, level: Deck['level'] = 'N5'): Deck => {
    const newDeck: Deck = {
      id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description?.trim() || '',
      level,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    setDecks(prev => [newDeck, ...prev]);
    setActiveDeckIds(prev => [...prev, newDeck.id]);
    return newDeck;
  };

  const updateDeck = (id: string, updates: Partial<Deck>) => {
    setDecks(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDeck = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    setWords(prev => prev.filter(w => w.deckId !== id));
    setActiveDeckIds(prev => prev.filter(dId => dId !== id));
  };

  const toggleActiveDeck = (id: string) => {
    setActiveDeckIds(prev =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter(x => x !== id)
          : prev // Luôn giữ ít nhất 1 bộ từ
        : [...prev, id]
    );
  };

  const toggleActiveTopic = (topic: string) => {
    setActiveTopics(prev => {
      // Nếu đang chọn ALL mà bấm 1 chủ đề cụ thể -> chuyển sang chọn chủ đề đó
      if (prev.includes('ALL')) {
        return [topic];
      }
      // Nếu đã có chủ đề này -> bỏ chọn (nếu bỏ hết thì về ALL)
      if (prev.includes(topic)) {
        const next = prev.filter(t => t !== topic);
        return next.length === 0 ? ['ALL'] : next;
      }
      // Nếu chưa có -> thêm vào
      return [...prev, topic];
    });
  };

  const selectAllTopics = () => {
    setActiveTopics(['ALL']);
  };

  const clearAllTopics = () => {
    setActiveTopics([]);
  };

  // Danh sách từ vựng được lọc theo cả bộ từ (Deck) và chủ đề (Topic)
  const studyWords = useMemo(() => {
    return words.filter(w => {
      const matchDeck = activeDeckIds.includes(w.deckId);
      const matchTopic =
        activeTopics.length === 0 ||
        activeTopics.includes('ALL') ||
        (w.topic && activeTopics.includes(w.topic));
      return matchDeck && matchTopic;
    });
  }, [words, activeDeckIds, activeTopics]);

  // Từ vựng CRUD
  const addWord = (wordData: Omit<VocabWord, 'id' | 'createdAt'>): VocabWord => {
    const newWord: VocabWord = {
      ...wordData,
      id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isMastered: false,
    };
    setWords(prev => [newWord, ...prev]);
    return newWord;
  };

  const addWordsBulk = (newWords: Partial<VocabWord>[], deckId: string): number => {
    const prepared: VocabWord[] = newWords.map((w, idx) => ({
      id: w.id || `word_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      japanese: (w.japanese || w.reading || '').trim(),
      reading: (w.reading || w.japanese || '').trim(),
      hanViet: (w.hanViet || '').trim(),
      meaningVi: (w.meaningVi || '').trim(),
      example: (w.example || '').trim(),
      level: w.level || 'N5',
      topic: (w.topic || 'Tổng hợp').trim(),
      deckId,
      createdAt: new Date().toISOString(),
      isMastered: false,
    }));

    setWords(prev => [...prepared, ...prev]);
    return prepared.length;
  };

  const updateWord = (id: string, updates: Partial<VocabWord>) => {
    setWords(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteWord = (id: string) => {
    setWords(prev => prev.filter(w => w.id !== id));
  };

  const toggleWordMastered = (id: string, mastered?: boolean) => {
    setWords(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        const newStatus = mastered !== undefined ? mastered : !w.isMastered;
        return { ...w, isMastered: newStatus };
      })
    );
  };

  const updateWordSRS = (id: string, grade: number) => {
    // Đánh dấu đã thuộc nếu grade >= 3
    setWords(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        return { ...w, isMastered: grade >= 3 };
      })
    );
  };

  const resetDeckSRS = (deckId: string) => {
    setWords(prev =>
      prev.map(w =>
        w.deckId === deckId ? { ...w, isMastered: false } : w
      )
    );
  };

  // Ghi nhận chuỗi học và điểm số
  const recordStudyResult = (correctCount: number, totalCount: number) => {
    const today = new Date().toISOString().split('T')[0];

    setStats(prev => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = prev.streak;
      if (prev.lastStudyDate === today) {
        // Đã học hôm nay, giữ nguyên streak
      } else if (prev.lastStudyDate === yesterdayStr) {
        newStreak += 1; // Tiếp nối chuỗi
      } else {
        newStreak = 1; // Bắt đầu chuỗi mới
      }

      const existingDay = prev.history[today] || { total: 0, correct: 0 };
      const updatedHistory = {
        ...prev.history,
        [today]: {
          total: existingDay.total + totalCount,
          correct: existingDay.correct + correctCount,
        },
      };

      // Đếm từ đã thuộc
      const mastered = words.filter(w => w.isMastered).length;

      return {
        streak: newStreak,
        lastStudyDate: today,
        totalMastered: mastered,
        history: updatedHistory,
      };
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Export & Import toàn bộ dữ liệu ra JSON
  const exportAllData = (): string => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      decks,
      words,
      settings,
      stats,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importAllData = (jsonData: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.decks || !Array.isArray(parsed.decks) || !parsed.words || !Array.isArray(parsed.words)) {
        return { success: false, message: 'File sao lưu không đúng định dạng của Kotoba Dojo!' };
      }

      setDecks(parsed.decks);
      setWords(parsed.words);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.stats) setStats(parsed.stats);
      if (parsed.decks.length > 0) {
        setActiveDeckIds([parsed.decks[0].id]);
      }

      return {
        success: true,
        message: `Đã khôi phục thành công ${parsed.decks.length} bộ từ và ${parsed.words.length} từ vựng!`,
      };
    } catch (e) {
      return { success: false, message: 'Lỗi cú pháp file JSON: ' + (e as Error).message };
    }
  };

  // Đồng bộ Firebase Firestore
  const syncWithFirebase = async () => {
    if (!user || !db) return;
    const firestore = db;
    setIsSyncing(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const dataDoc = {
        decks,
        words,
        settings,
        stats,
        lastSyncedAt: new Date().toISOString(),
      };
      await setDoc(userRef, dataDoc, { merge: true });
      setLastSyncedText(new Date().toLocaleTimeString('vi-VN'));
    } catch (error) {
      console.error('Lỗi đồng bộ Firebase:', error);
      alert('Không thể đồng bộ với Firestore. Vui lòng kiểm tra quyền truy cập database.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Tự động tải từ Firebase lần đầu đăng nhập nếu có
  useEffect(() => {
    if (!user || !db) return;
    const firestore = db;

    const fetchCloudData = async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const cloudData = snap.data();
          if (cloudData.decks && Array.isArray(cloudData.decks) && cloudData.decks.length > 0) {
            setDecks(cloudData.decks);
          }
          if (cloudData.words && Array.isArray(cloudData.words) && cloudData.words.length > 0) {
            setWords(cloudData.words);
          }
          if (cloudData.stats) setStats(cloudData.stats);
          if (cloudData.settings) setSettings(cloudData.settings);
          if (cloudData.lastSyncedAt) {
            setLastSyncedText(new Date(cloudData.lastSyncedAt).toLocaleTimeString('vi-VN'));
          }
        }
      } catch (err) {
        console.warn('Lỗi đọc dữ liệu Firestore:', err);
      }
    };

    fetchCloudData();
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        decks,
        words,
        activeDeckIds,
        setActiveDeckIds,
        toggleActiveDeck,
        activeTopics,
        setActiveTopics,
        toggleActiveTopic,
        selectAllTopics,
        clearAllTopics,
        studyWords,
        addDeck,
        updateDeck,
        deleteDeck,
        addWord,
        addWordsBulk,
        updateWord,
        deleteWord,
        toggleWordMastered,
        updateWordSRS,
        resetDeckSRS,
        settings,
        updateSettings,
        stats,
        recordStudyResult,
        exportAllData,
        importAllData,
        syncWithFirebase,
        isSyncing,
        lastSyncedText,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp phải được bọc trong <AppProvider>');
  }
  return context;
};
