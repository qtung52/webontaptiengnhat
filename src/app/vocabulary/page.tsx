'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { VocabWord, JLPTLevel, Deck } from '@/types';
import { KanaInput } from '@/components/KanaInput';
import { AudioButton } from '@/components/AudioButton';
import { Modal } from '@/components/Modal';
import { FuriganaText } from '@/components/FuriganaText';
import {
  parseCSVFile,
  parseExcelFile,
  parseJSONFile,
  parsePastedText,
  convertMappedRowsToVocab,
  downloadSampleTemplate,
  ColumnMapping,
  ParseResult,
} from '@/lib/file-importer';
import {
  Plus,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit2,
  Download,
  AlertTriangle,
  CheckCircle,
  FolderPlus,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function VocabularyPage() {
  const {
    decks,
    words,
    activeDeckIds,
    toggleActiveDeck,
    addDeck,
    deleteDeck,
    addWord,
    addWordsBulk,
    updateWord,
    deleteWord,
  } = useApp();

  // State điều hướng & Bộ lọc
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'deck-n5-sample');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');

  // Modals
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);

  // Form Thêm từ đơn / Nhanh
  const [formJapanese, setFormJapanese] = useState('');
  const [formReading, setFormReading] = useState('');
  const [formHanViet, setFormHanViet] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formLevel, setFormLevel] = useState<JLPTLevel>('N5');
  const [formTopic, setFormTopic] = useState('');
  const [fastAddMode, setFastAddMode] = useState(true);
  const japaneseInputRef = useRef<HTMLInputElement>(null);

  // Form Dán văn bản
  const [pasteText, setPasteText] = useState('');

  // Form Nhập File
  const [fileParseResult, setFileParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    japanese: '',
    reading: '',
    hanViet: '',
    meaningVi: '',
    example: '',
    level: '',
    topic: '',
  });
  const [fileName, setFileName] = useState('');
  const [isFileLoading, setIsFileLoading] = useState(false);

  // Form Thêm Deck
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckLevel, setNewDeckLevel] = useState<JLPTLevel>('N5');

  // Danh sách chủ đề có trong bộ từ hiện tại
  const currentDeckWords = useMemo(() => {
    return words.filter(w => w.deckId === selectedDeckId);
  }, [words, selectedDeckId]);

  const topicsInDeck = useMemo(() => {
    const set = new Set<string>();
    currentDeckWords.forEach(w => {
      if (w.topic) set.add(w.topic);
    });
    return Array.from(set);
  }, [currentDeckWords]);

  // Lọc từ hiển thị trong bảng
  const filteredWords = useMemo(() => {
    return currentDeckWords.filter(w => {
      const matchSearch =
        searchQuery === '' ||
        w.japanese.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.reading.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.hanViet && w.hanViet.toLowerCase().includes(searchQuery.toLowerCase())) ||
        w.meaningVi.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLevel = levelFilter === 'ALL' || w.level === levelFilter;
      const matchTopic = topicFilter === 'ALL' || w.topic === topicFilter;

      return matchSearch && matchLevel && matchTopic;
    });
  }, [currentDeckWords, searchQuery, levelFilter, topicFilter]);

  // Phân trang danh sách từ (Tăng tốc độ hiển thị & chuyển tab cực mượt)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeckId, searchQuery, levelFilter, topicFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / pageSize));
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWords.slice(start, start + pageSize);
  }, [filteredWords, currentPage, pageSize]);

  // Xử lý thêm từ
  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJapanese.trim() || !formMeaning.trim()) {
      alert('Vui lòng nhập từ tiếng Nhật và nghĩa tiếng Việt!');
      return;
    }

    if (editingWord) {
      updateWord(editingWord.id, {
        japanese: formJapanese.trim(),
        reading: formReading.trim() || formJapanese.trim(),
        hanViet: formHanViet.trim(),
        meaningVi: formMeaning.trim(),
        example: formExample.trim(),
        level: formLevel,
        topic: formTopic.trim() || 'Tổng hợp',
      });
      setEditingWord(null);
      setShowAddWordModal(false);
    } else {
      addWord({
        japanese: formJapanese.trim(),
        reading: formReading.trim() || formJapanese.trim(),
        hanViet: formHanViet.trim(),
        meaningVi: formMeaning.trim(),
        example: formExample.trim(),
        level: formLevel,
        topic: formTopic.trim() || 'Tổng hợp',
        deckId: selectedDeckId,
      });

      if (fastAddMode) {
        // Reset ô nhập để thêm tiếp tức thì
        setFormJapanese('');
        setFormReading('');
        setFormHanViet('');
        setFormMeaning('');
        setFormExample('');
        japaneseInputRef.current?.focus();
      } else {
        setShowAddWordModal(false);
      }
    }
  };

  const openEditModal = (word: VocabWord) => {
    setEditingWord(word);
    setFormJapanese(word.japanese);
    setFormReading(word.reading);
    setFormHanViet(word.hanViet || '');
    setFormMeaning(word.meaningVi);
    setFormExample(word.example || '');
    setFormLevel(word.level || 'N5');
    setFormTopic(word.topic || '');
    setShowAddWordModal(true);
  };

  const openCreateWordModal = () => {
    setEditingWord(null);
    setFormJapanese('');
    setFormReading('');
    setFormHanViet('');
    setFormMeaning('');
    setFormExample('');
    setFormLevel('N5');
    setFormTopic('');
    setShowAddWordModal(true);
  };

  // Xử lý Dán văn bản
  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    const { validWords, errors } = parsePastedText(pasteText);
    if (errors.length > 0 && validWords.length === 0) {
      alert(`Lỗi: ${errors[0].reason}`);
      return;
    }

    const count = addWordsBulk(validWords, selectedDeckId);
    alert(`Đã nạp thành công ${count} từ vựng!${errors.length > 0 ? ` (${errors.length} dòng lỗi bị bỏ qua)` : ''}`);
    setPasteText('');
    setShowPasteModal(false);
  };

  // Xử lý Tải File lên
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsFileLoading(true);

    try {
      let result: ParseResult;
      const lower = file.name.toLowerCase();

      if (lower.endsWith('.csv')) {
        result = await parseCSVFile(file);
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        result = await parseExcelFile(file);
      } else if (lower.endsWith('.json')) {
        result = await parseJSONFile(file);
      } else {
        // txt
        const text = await file.text();
        const parsed = parsePastedText(text);
        const count = addWordsBulk(parsed.validWords, selectedDeckId);
        alert(`Đã nạp thành công ${count} từ từ file text!`);
        setIsFileLoading(false);
        setShowFileModal(false);
        return;
      }

      setFileParseResult(result);
      setColumnMapping(result.detectedMapping);
    } catch (err) {
      alert('Lỗi đọc file: ' + (err as Error).message);
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleConfirmFileImport = () => {
    if (!fileParseResult) return;
    const { validWords, errors } = convertMappedRowsToVocab(
      fileParseResult.rows,
      columnMapping,
      selectedDeckId
    );

    if (validWords.length === 0) {
      alert('Không có từ hợp lệ nào được tìm thấy. Vui lòng kiểm tra lại ghép cột.');
      return;
    }

    const count = addWordsBulk(validWords, selectedDeckId);
    alert(`Hoàn tất! Đã thêm ${count} từ vựng vào bộ từ.${errors.length > 0 ? ` Có ${errors.length} dòng lỗi.` : ''}`);
    setFileParseResult(null);
    setShowFileModal(false);
  };

  // Tạo Deck mới
  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;
    const created = addDeck(newDeckTitle, newDeckDesc, newDeckLevel);
    setSelectedDeckId(created.id);
    setNewDeckTitle('');
    setNewDeckDesc('');
    setShowAddDeckModal(false);
  };

  const currentDeck = decks.find(d => d.id === selectedDeckId) || decks[0];

  return (
    <div className="space-y-6">
      {/* Header & Bộ điều khiển chính */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Quản Lý Bộ Từ Vựng
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-torii-500/10 dark:bg-torii-500/20 text-torii-600 dark:text-torii-400 border border-torii-500/20 font-jp">
              単語
            </span>
          </div>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
            Nạp từ linh hoạt bằng File (CSV / Excel), Form thêm nhanh, dán văn bản hàng loạt
          </p>
        </div>

        {/* Nút hành động thêm từ */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openCreateWordModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-torii-500 to-torii-600 hover:from-torii-600 hover:to-torii-700 text-white font-bold text-xs shadow-lg shadow-torii-500/25 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>Thêm từ mới</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFileModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-200 font-semibold text-xs shadow-sm hover:shadow transition-all"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" />
            <span>Nhập File</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-200 font-semibold text-xs shadow-sm hover:shadow transition-all"
          >
            <FileText size={16} className="text-blue-500" />
            <span>Dán văn bản</span>
          </button>
        </div>
      </div>

      {/* Thanh Chọn Bộ Từ & Tạo Bộ Mới */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
        {decks.map(deck => {
          const isSelected = deck.id === selectedDeckId;
          const wordCount = words.filter(w => w.deckId === deck.id).length;
          return (
            <button
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-100 dark:to-white text-white dark:text-stone-950 shadow-md shadow-stone-900/10'
                  : 'glass-card text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80'
              }`}
            >
              <span>{deck.title}</span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/20 dark:bg-stone-900/20 text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                }`}
              >
                {wordCount}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowAddDeckModal(true)}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border border-dashed border-stone-300 dark:border-stone-700 text-stone-500 hover:text-torii-600 dark:hover:text-torii-400 hover:border-torii-400 dark:hover:border-torii-500 flex items-center gap-2 transition-all hover:bg-torii-50/50 dark:hover:bg-torii-950/20"
        >
          <FolderPlus size={15} />
          <span>Tạo bộ mới</span>
        </button>
      </div>

      {/* Thông tin bộ từ & Nút xóa / Bật tắt ôn tập */}
      {currentDeck && (
        <div className="glass-panel p-5 sm:p-6 rounded-[2rem] border border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-6 -bottom-6 text-7xl font-jp font-black text-stone-200/20 dark:text-white/[0.02] pointer-events-none select-none">
            {currentDeck.level || '語'}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {currentDeck.title}
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-torii-500/10 dark:bg-torii-500/20 text-torii-600 dark:text-torii-400 border border-torii-500/30">
                {currentDeck.level || 'N5'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              {currentDeck.description || 'Không có mô tả'} • Tổng cộng <strong className="text-stone-800 dark:text-stone-200">{currentDeckWords.length}</strong> từ
            </p>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            <button
              type="button"
              onClick={() => toggleActiveDeck(currentDeck.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                activeDeckIds.includes(currentDeck.id)
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10'
                  : 'border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:border-torii-400'
              }`}
            >
              {activeDeckIds.includes(currentDeck.id) ? '✓ Đang bật ôn tập' : '+ Bật để ôn tập'}
            </button>

            {currentDeck.isCustom && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa bộ từ "${currentDeck.title}" và toàn bộ từ trong đó?`)) {
                    deleteDeck(currentDeck.id);
                    setSelectedDeckId(decks[0]?.id || '');
                  }
                }}
                className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                title="Xóa bộ từ này"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thanh Tìm Kiếm & Lọc Từ Vựng */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo từ tiếng Nhật, cách đọc, Hán Việt, nghĩa..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs glass-card border border-stone-200/80 dark:border-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-torii-500/50 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc Cấp độ */}
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl text-xs glass-card border border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-torii-500/50 shadow-sm font-medium"
          >
            <option value="ALL">Tất cả cấp độ</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>

          {/* Lọc Chủ đề */}
          <select
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl text-xs glass-card border border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-torii-500/50 max-w-[170px] truncate shadow-sm font-medium"
          >
            <option value="ALL">Tất cả chủ đề</option>
            {topicsInDeck.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh Sách Từ Vựng Bảng / Card */}
      <div className="glass-panel rounded-[2rem] border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xl shadow-stone-900/5 dark:shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/80 dark:bg-stone-900/70 text-stone-400 dark:text-stone-500 uppercase tracking-wider text-[10px] font-bold border-b border-stone-200/80 dark:border-stone-800/80 backdrop-blur-sm">
                <th className="py-3.5 px-5">Tiếng Nhật & Furigana</th>
                <th className="py-3.5 px-4">Hán Việt</th>
                <th className="py-3.5 px-4">Nghĩa tiếng Việt</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Ví dụ</th>
                <th className="py-3.5 px-3">Cấp / Bài</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
              {paginatedWords.map(word => (
                <tr
                  key={word.id}
                  className="hover:bg-torii-500/[0.04] dark:hover:bg-torii-500/[0.06] transition-colors group"
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <FuriganaText
                        japanese={word.japanese}
                        reading={word.reading}
                        className="font-jp font-bold text-base text-stone-900 dark:text-stone-100"
                      />
                      <AudioButton text={word.japanese} size="sm" />
                    </div>
                    {word.reading && word.reading !== word.japanese && (
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 font-jp block mt-0.5">
                        {word.reading}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-black text-torii-600 dark:text-torii-400 tracking-wide uppercase">
                    {word.hanViet || '—'}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-stone-800 dark:text-stone-200">
                    {word.meaningVi}
                  </td>

                  <td className="py-3.5 px-4 hidden md:table-cell text-stone-500 dark:text-stone-400 max-w-xs truncate">
                    {word.example || '—'}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-600 dark:text-stone-300 border border-stone-200/50 dark:border-stone-700/50">
                      {word.level || 'N5'}
                    </span>
                    {word.topic && (
                      <span className="block text-[10px] text-stone-400 dark:text-stone-500 truncate max-w-[100px] mt-0.5">
                        {word.topic}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEditModal(word)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Sửa từ"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Xóa từ "${word.japanese}"?`)) {
                            deleteWord(word.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Xóa từ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Thanh phân trang mượt mà */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/40 text-xs text-stone-500">
              <div>
                Hiển thị <span className="font-bold text-stone-800 dark:text-stone-200">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredWords.length)}</span> / {filteredWords.length} từ
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-700/80 bg-white dark:bg-stone-800 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors font-semibold shadow-sm"
                >
                  Trang trước
                </button>
                <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800/90 font-bold text-stone-700 dark:text-stone-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-700/80 bg-white dark:bg-stone-800 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors font-semibold shadow-sm"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}

          {filteredWords.length === 0 && (
            <div className="text-center py-16 text-stone-400 dark:text-stone-500 text-xs space-y-2">
              <Layers size={36} className="mx-auto text-stone-300 dark:text-stone-700 stroke-[1.5]" />
              <p>Chưa có từ vựng nào trong danh sách này.</p>
              <p className="text-[11px] text-stone-400">Bấm &quot;Thêm từ mới&quot; hoặc &quot;Nhập File&quot; để bắt đầu bổ sung từ vựng!</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Thêm / Sửa từ đơn */}
      <Modal
        isOpen={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        title={editingWord ? 'Sửa Từ Vựng' : 'Thêm Từ Mới (Có chuyển đổi Kana)'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveWord} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Tiếng Nhật (Kanji hoặc Kana) *
            </label>
            <KanaInput
              ref={japaneseInputRef}
              value={formJapanese}
              onChange={setFormJapanese}
              placeholder="Gõ tiếng Nhật (vd: 食べる hoặc taberu)..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Cách đọc Kana (Furigana)
              </label>
              <KanaInput
                value={formReading}
                onChange={setFormReading}
                placeholder="vd: たべる"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Âm Hán Việt
              </label>
              <input
                type="text"
                value={formHanViet}
                onChange={e => setFormHanViet(e.target.value.toUpperCase())}
                placeholder="vd: THỰC"
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 font-bold uppercase transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Nghĩa tiếng Việt *
            </label>
            <input
              type="text"
              required
              value={formMeaning}
              onChange={e => setFormMeaning(e.target.value)}
              placeholder="vd: Ăn (cơm, bánh...)"
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Câu ví dụ (kèm dịch)
            </label>
            <input
              type="text"
              value={formExample}
              onChange={e => setFormExample(e.target.value)}
              placeholder="vd: 朝ご飯を食べます。(Tôi ăn sáng.)"
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Cấp độ JLPT
              </label>
              <select
                value={formLevel}
                onChange={e => setFormLevel(e.target.value as JLPTLevel)}
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium transition-all"
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Chủ đề / Bài học
              </label>
              <input
                type="text"
                value={formTopic}
                onChange={e => setFormTopic(e.target.value)}
                placeholder="vd: Bài 1, Động từ..."
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 transition-all"
              />
            </div>
          </div>

          {!editingWord && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="fastAddMode"
                checked={fastAddMode}
                onChange={e => setFastAddMode(e.target.checked)}
                className="w-4 h-4 rounded text-torii-600 focus:ring-torii-500 cursor-pointer"
              />
              <label htmlFor="fastAddMode" className="text-xs text-stone-600 dark:text-stone-400 cursor-pointer font-medium">
                Chế độ thêm nhanh liên tiếp (Lưu xong tự xóa trắng để nhập từ tiếp)
              </label>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddWordModal(false)}
              className="px-4 py-2.5 rounded-2xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-torii-500 to-torii-600 hover:from-torii-600 hover:to-torii-700 text-white font-bold text-xs shadow-lg shadow-torii-500/25 active:scale-95 transition-all"
            >
              {editingWord ? 'Cập nhật từ' : fastAddMode ? 'Lưu & Thêm tiếp' : 'Lưu từ vựng'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Dán văn bản nhiều dòng */}
      <Modal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        title="Dán Văn Bản Nhập Hàng Loạt"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500">
            Dán nhiều dòng dạng <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono text-torii-600">từ | cách đọc | nghĩa</code> hoặc ngăn cách bằng tab (Excel copy sang) hoặc dấu phẩy:
          </p>

          <textarea
            rows={8}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder={`食べる | たべる | Ăn\n飲む | のむ | Uống\n本 | ほん | Quyển sách\n先生 | せんせい | Thầy cô giáo`}
            className="w-full p-4 font-mono text-xs rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-torii-500 shadow-sm transition-all"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-stone-400">
              Đang nhập vào bộ từ: <strong className="text-stone-700 dark:text-stone-300">{currentDeck?.title}</strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2.5 rounded-2xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-torii-500 to-torii-600 hover:from-torii-600 hover:to-torii-700 text-white font-bold text-xs shadow-lg shadow-torii-500/25 active:scale-95 transition-all"
              >
                Xác nhận nạp từ
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Nhập File CSV / XLSX / JSON */}
      <Modal
        isOpen={showFileModal}
        onClose={() => {
          setShowFileModal(false);
          setFileParseResult(null);
        }}
        title="Nhập Từ Vựng Bằng File (CSV, Excel, JSON)"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {!fileParseResult ? (
            <div className="space-y-4">
              {/* Vùng kéo thả file */}
              <label className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-torii-500 dark:hover:border-torii-400 rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-stone-50/50 dark:bg-stone-800/30 hover:bg-torii-50/20">
                <UploadCloud size={44} className="text-torii-500 mb-2" />
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  Chọn file từ máy tính
                </span>
                <span className="text-xs text-stone-400 mt-1">
                  Hỗ trợ định dạng .xlsx, .xls, .csv, .json, .txt
                </span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, .json, .txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Tải file mẫu */}
              <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-stone-200/50 dark:border-stone-700/50">
                <div>
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Chưa có file mẫu?
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Tải về file chuẩn với đầy đủ các cột gợi ý sẵn
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('xlsx')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-sm hover:text-torii-600 flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={13} /> Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('csv')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-sm hover:text-torii-600 flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={13} /> CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate('json')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-sm hover:text-torii-600 flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={13} /> JSON
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Bước xem trước & Ghép cột thủ công */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400">File đã chọn:</span>
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {fileName} ({fileParseResult.rows.length} dòng dữ liệu)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFileParseResult(null)}
                  className="text-xs text-torii-600 font-semibold hover:underline"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Ghép cột */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Khớp nối cột (Hệ thống đã tự nhận dạng, bạn có thể chỉnh lại):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Cột Tiếng Nhật *
                    </label>
                    <select
                      value={columnMapping.japanese}
                      onChange={e => setColumnMapping({ ...columnMapping, japanese: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium"
                    >
                      <option value="">-- Chọn cột --</option>
                      {fileParseResult.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Cột Cách đọc (Kana)
                    </label>
                    <select
                      value={columnMapping.reading}
                      onChange={e => setColumnMapping({ ...columnMapping, reading: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium"
                    >
                      <option value="">-- Chọn cột --</option>
                      {fileParseResult.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Cột Nghĩa tiếng Việt *
                    </label>
                    <select
                      value={columnMapping.meaningVi}
                      onChange={e => setColumnMapping({ ...columnMapping, meaningVi: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium"
                    >
                      <option value="">-- Chọn cột --</option>
                      {fileParseResult.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Cột Hán Việt
                    </label>
                    <select
                      value={columnMapping.hanViet}
                      onChange={e => setColumnMapping({ ...columnMapping, hanViet: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium"
                    >
                      <option value="">-- Chọn cột --</option>
                      {fileParseResult.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Cột Ví dụ
                    </label>
                    <select
                      value={columnMapping.example}
                      onChange={e => setColumnMapping({ ...columnMapping, example: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium"
                    >
                      <option value="">-- Chọn cột --</option>
                      {fileParseResult.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Cột Cấp độ / Bài
                    </label>
                    <select
                      value={columnMapping.level}
                      onChange={e => setColumnMapping({ ...columnMapping, level: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium"
                    >
                      <option value="">-- Chọn cột --</option>
                      {fileParseResult.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bảng xem trước 3 dòng đầu */}
              <div>
                <p className="text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                  Xem trước dữ liệu dòng mẫu:
                </p>
                <div className="border border-stone-200 dark:border-stone-700 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-stone-100 dark:bg-stone-800 font-semibold text-stone-600 dark:text-stone-300">
                      <tr>
                        {fileParseResult.headers.map(h => (
                          <th key={h} className="p-2.5 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {fileParseResult.rows.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          {fileParseResult.headers.map(h => (
                            <td key={h} className="p-2.5 whitespace-nowrap max-w-[120px] truncate">
                              {r[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFileParseResult(null)}
                  className="px-4 py-2.5 rounded-2xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFileImport}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-torii-500 to-torii-600 hover:from-torii-600 hover:to-torii-700 text-white font-bold text-xs shadow-lg shadow-torii-500/25 active:scale-95 transition-all"
                >
                  Xác nhận nạp toàn bộ vào bộ từ
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 4: Tạo bộ từ mới */}
      <Modal
        isOpen={showAddDeckModal}
        onClose={() => setShowAddDeckModal(false)}
        title="Tạo Bộ Từ Vựng Mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDeck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Tên bộ từ *
            </label>
            <input
              type="text"
              required
              value={newDeckTitle}
              onChange={e => setNewDeckTitle(e.target.value)}
              placeholder="vd: Mimikara Bài 1, Từ vựng chuyên ngành..."
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Mô tả ngắn
            </label>
            <input
              type="text"
              value={newDeckDesc}
              onChange={e => setNewDeckDesc(e.target.value)}
              placeholder="vd: Tổng hợp từ vựng quan trọng thi JLPT"
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Cấp độ dự kiến
            </label>
            <select
              value={newDeckLevel}
              onChange={e => setNewDeckLevel(e.target.value as JLPTLevel)}
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-torii-500 font-medium shadow-sm transition-all"
            >
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
              <option value="Chung">Chung / Khác</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddDeckModal(false)}
              className="px-4 py-2.5 rounded-2xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-torii-500 to-torii-600 hover:from-torii-600 hover:to-torii-700 text-white font-bold text-xs shadow-lg shadow-torii-500/25 active:scale-95 transition-all"
            >
              Tạo bộ từ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

