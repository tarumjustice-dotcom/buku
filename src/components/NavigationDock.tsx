import React, { useState } from 'react';
import { Book, ViewMode, AmbianceTheme } from '../types/book';
import { soundEngine } from '../utils/audio';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Volume2,
  VolumeX,
  Palette,
  Upload,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NavigationDockProps {
  book: Book;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenTOC: () => void;
  onOpenThumbnails: () => void;
  onOpenUpload: () => void;
  ambiance: AmbianceTheme;
  onAmbianceChange: (theme: AmbianceTheme) => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  book,
  currentPage,
  onPageChange,
  isOpen,
  onToggleOpen,
  viewMode,
  onViewModeChange,
  onOpenTOC,
  onOpenThumbnails,
  onOpenUpload,
  ambiance,
  onAmbianceChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showAmbianceMenu, setShowAmbianceMenu] = useState<boolean>(false);

  const handlePrev = () => {
    if (currentPage > 1) {
      const step = viewMode === 'three3d' ? 2 : (currentPage === 2 ? 1 : 2);
      onPageChange(Math.max(1, currentPage - step));
      soundEngine.playPageFlip();
    }
  };

  const handleNext = () => {
    if (currentPage < book.totalPages) {
      const step = viewMode === 'three3d' ? 2 : 2;
      onPageChange(Math.min(book.totalPages, currentPage + step));
      soundEngine.playPageFlip();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value, 10);
    onPageChange(page);
    soundEngine.playPageFlip('fast');
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-transform duration-300 ease-out max-w-[min(960px,95vw)] w-full pointer-events-auto ${
        isCollapsed ? 'translate-y-[calc(100%-12px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand tab */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-4 py-1 text-[11px] font-medium tracking-wide uppercase bg-neutral-900/95 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700/80 rounded-full transition shadow-lg flex items-center gap-1.5"
        >
          {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span>{isCollapsed ? 'Buka Kontrol Navigasi' : 'Sembunyikan Dock'}</span>
        </button>
      </div>

      {/* Main Solid Dock Surface */}
      <div className="bg-neutral-900/95 border border-neutral-700/80 rounded-2xl px-4 py-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        {/* Left: Open/Close & View Mode Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => {
              const next = !isOpen;
              onToggleOpen(next);
              if (next) soundEngine.playBookOpen();
              else soundEngine.playBookClose();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-medium text-xs flex items-center gap-2 transition ${
              isOpen
                ? 'bg-amber-500 text-neutral-950 font-semibold hover:bg-amber-400'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-600'
            }`}
          >
            <BookOpen size={15} />
            <span>{isOpen ? 'Tutup Buku' : 'Buka Buku'}</span>
          </button>

          {/* View Mode Toggle: FlipHTML5 Reader vs Three.js 3D */}
          <div className="flex bg-neutral-950/80 p-0.5 rounded-xl border border-neutral-800">
            <button
              onClick={() => onViewModeChange('fliphtml5')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'fliphtml5'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers size={13} />
              <span>FlipHTML5</span>
            </button>
            <button
              onClick={() => onViewModeChange('three3d')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'three3d'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>3D Studio</span>
            </button>
          </div>
        </div>

        {/* Center: Page Scrubber Slider & Prev/Next */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center flex-1 max-w-[480px]">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 rounded-lg border border-neutral-700 transition"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Range Slider */}
          <div className="flex items-center gap-2 flex-1">
            <input
              type="range"
              min="1"
              max={book.totalPages}
              value={currentPage}
              onChange={handleSliderChange}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="font-mono text-xs text-neutral-300 w-16 text-right whitespace-nowrap">
              {currentPage}/{book.totalPages}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage >= book.totalPages}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 rounded-lg border border-neutral-700 transition"
            title="Halaman Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Drawer Buttons (TOC, Thumbnails, PDF Upload, Sound, Ambiance) */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <button
            onClick={onOpenTOC}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700/80 transition"
            title="Daftar Isi"
          >
            <List size={16} />
          </button>

          <button
            onClick={onOpenThumbnails}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700/80 transition"
            title="Miniatur Halaman"
          >
            <LayoutGrid size={16} />
          </button>

          <button
            onClick={onOpenUpload}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700/80 transition flex items-center gap-1.5 text-xs font-medium"
            title="Buka / Unggah File PDF"
          >
            <Upload size={14} className="text-amber-400" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700/80'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800'
            }`}
            title={soundEnabled ? 'Matikan Suara Kertas' : 'Aktifkan Suara Kertas'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Ambiance Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAmbianceMenu(!showAmbianceMenu)}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700/80 transition"
              title="Ganti Tema Suasana Ruang Baca"
            >
              <Palette size={16} />
            </button>

            {showAmbianceMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                  Suasana Ruang Baca
                </p>
                <button
                  onClick={() => {
                    onAmbianceChange('studio-dark');
                    setShowAmbianceMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                    ambiance === 'studio-dark'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-neutral-950 border border-neutral-700" />
                  <span>Studio Obsidian</span>
                </button>
                <button
                  onClick={() => {
                    onAmbianceChange('walnut-library');
                    setShowAmbianceMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                    ambiance === 'walnut-library'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-[#271810] border border-[#523321]" />
                  <span>Perpustakaan Kayu</span>
                </button>
                <button
                  onClick={() => {
                    onAmbianceChange('nordic-slate');
                    setShowAmbianceMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                    ambiance === 'nordic-slate'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-[#1e293b] border border-[#334155]" />
                  <span>Nordic Slate</span>
                </button>
                <button
                  onClick={() => {
                    onAmbianceChange('midnight-cosmic');
                    setShowAmbianceMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                    ambiance === 'midnight-cosmic'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-[#0d0d26] border border-[#2e2e60]" />
                  <span>Midnight Space</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
