import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Book, PageContent } from '../types/book';
import { soundEngine } from '../utils/audio';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Play,
  Pause,
  Bookmark,
  Share2,
  Printer,
  Sparkles,
} from 'lucide-react';

interface FlipBookReaderProps {
  book: Book;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  onOpenAICompanion?: () => void;
  onOpenTOC?: () => void;
  onOpenThumbnails?: () => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  corner: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | null;
  side: 'left' | 'right';
  progress: number; // 0 to 1
}

export const FlipBookReader: React.FC<FlipBookReaderProps> = ({
  book,
  currentPage,
  onPageChange,
  isOpen,
  onToggleOpen,
  onOpenAICompanion,
  onOpenTOC,
  onOpenThumbnails,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);

  // Reader state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [hoveredCorner, setHoveredCorner] = useState<string | null>(null);

  // Drag flip state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    corner: null,
    side: 'right',
    progress: 0,
  });

  // Calculate current left and right page numbers (1-indexed)
  // Page 1 is always the single front cover on the right side if closed or opened to cover
  const isFirstPageCover = currentPage === 1;
  const isLastPageBack = currentPage >= book.totalPages;
  const leftPageNum = isFirstPageCover ? null : currentPage % 2 === 0 ? currentPage : currentPage - 1;
  const rightPageNum = isFirstPageCover ? 1 : leftPageNum !== null ? leftPageNum + 1 : 2;

  const leftPage: PageContent | undefined = leftPageNum ? book.pages[leftPageNum - 1] : undefined;
  const rightPage: PageContent | undefined = rightPageNum && rightPageNum <= book.totalPages ? book.pages[rightPageNum - 1] : undefined;

  // Auto-play presentation mode
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAuto && isOpen) {
      timer = setInterval(() => {
        if (currentPage < book.totalPages) {
          handleNextPage();
        } else {
          setIsPlayingAuto(false);
        }
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isPlayingAuto, currentPage, isOpen, book.totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && zoomLevel > 1) {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, book.totalPages, zoomLevel]);

  const handleNextPage = useCallback(() => {
    if (!isOpen) {
      onToggleOpen(true);
      soundEngine.playBookOpen();
      return;
    }
    if (currentPage >= book.totalPages) return;
    const step = currentPage === 1 ? 2 : 2;
    const next = Math.min(book.totalPages, currentPage + step);
    onPageChange(next);
    soundEngine.playPageFlip();
  }, [isOpen, currentPage, book.totalPages, onToggleOpen, onPageChange]);

  const handlePrevPage = useCallback(() => {
    if (currentPage <= 1) {
      if (isOpen) {
        onToggleOpen(false);
        soundEngine.playBookClose();
      }
      return;
    }
    const step = currentPage === 2 ? 1 : 2;
    const prev = Math.max(1, currentPage - step);
    onPageChange(prev);
    soundEngine.playPageFlip();
  }, [isOpen, currentPage, onToggleOpen, onPageChange]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleBookmark = (page: number) => {
    setBookmarkedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
    soundEngine.playBookmark();
  };

  // Drag interaction handlers for peeling page corner
  const handleCornerMouseDown = (
    e: React.MouseEvent,
    corner: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left',
    side: 'left' | 'right'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if valid flip direction
    if (side === 'right' && (!rightPage || rightPageNum! >= book.totalPages)) return;
    if (side === 'left' && (!leftPage || leftPageNum! <= 1)) return;

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      corner,
      side,
      progress: 0.1,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !bookContainerRef.current) {
      // Pan image if zoomed
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPanOffset({ x: dx, y: dy });
      }
      return;
    }

    const rect = bookContainerRef.current.getBoundingClientRect();
    const halfWidth = rect.width / 2;

    let deltaX = 0;
    if (dragState.side === 'right') {
      deltaX = dragState.startX - e.clientX;
    } else {
      deltaX = e.clientX - dragState.startX;
    }

    const progress = Math.max(0, Math.min(1, deltaX / halfWidth));
    setDragState((prev) => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
      progress,
    }));
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      if (dragState.progress > 0.38) {
        // Complete the flip
        if (dragState.side === 'right') {
          handleNextPage();
        } else {
          handlePrevPage();
        }
      }
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        corner: null,
        side: 'right',
        progress: 0,
      });
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none bg-neutral-950"
    >
      {/* Top Header Bar */}
      <div className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900/95 border border-neutral-700/80 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-neutral-100 font-title-custom">
                {book.title}
              </h2>
              <p className="text-xs text-neutral-400">
                {isOpen
                  ? isFirstPageCover
                    ? 'Sampul Depan (Klik untuk membuka)'
                    : `Menampilkan Halaman ${leftPageNum || 1} - ${rightPageNum || 2} dari ${book.totalPages}`
                  : 'Buku Tertutup'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Tools */}
        <div className="flex items-center gap-2">
          {onOpenAICompanion && (
            <button
              onClick={onOpenAICompanion}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600/90 to-amber-500/90 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Sparkles size={15} />
              <span>Asisten AI Buku</span>
            </button>
          )}

          <div className="hidden sm:flex items-center bg-neutral-900/95 border border-neutral-700/80 rounded-xl p-1 shadow-lg gap-1">
            <button
              onClick={() => {
                const nextZoom = Math.min(2.2, zoomLevel + 0.25);
                setZoomLevel(nextZoom);
              }}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              title="Perbesar (Zoom In)"
            >
              <ZoomIn size={16} />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-neutral-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => {
                const nextZoom = Math.max(1, zoomLevel - 0.25);
                setZoomLevel(nextZoom);
                if (nextZoom === 1) setPanOffset({ x: 0, y: 0 });
              }}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              title="Perkecil (Zoom Out)"
            >
              <ZoomOut size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsPlayingAuto(!isPlayingAuto)}
            className={`p-2.5 rounded-xl border transition shadow-lg flex items-center gap-1 text-xs ${
              isPlayingAuto
                ? 'bg-amber-500 text-neutral-950 border-amber-400 font-semibold'
                : 'bg-neutral-900/95 text-neutral-300 border-neutral-700/80 hover:bg-neutral-800'
            }`}
            title={isPlayingAuto ? 'Jeda Presentasi Otomatis' : 'Mulai Balik Otomatis (Slideshow)'}
          >
            {isPlayingAuto ? <Pause size={16} /> : <Play size={16} />}
            <span className="hidden md:inline">{isPlayingAuto ? 'Jeda' : 'Auto Play'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-neutral-900/95 hover:bg-neutral-800 text-neutral-300 rounded-xl border border-neutral-700/80 transition shadow-lg"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F)'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Main Book Stage Area */}
      <div
        className="relative flex-1 w-full flex items-center justify-center p-4 md:p-8"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          transition: dragState.isDragging || isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
        onMouseDown={(e) => {
          if (zoomLevel > 1 && (e.target as HTMLElement).tagName !== 'BUTTON') {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
          }
        }}
      >
        {/* Soft Ambient Contact Shadow Under Book */}
        <div className="absolute w-[85%] max-w-[1050px] h-12 bottom-6 bg-black/60 blur-2xl rounded-full pointer-events-none" />

        {/* Realistic Book Container with 3D Perspective */}
        <div
          ref={bookContainerRef}
          className="relative max-w-[1020px] w-full aspect-[1.42/1] max-h-[75vh] flex items-center justify-center"
          style={{ perspective: '2200px' }}
        >
          {/* If Book is Closed, Show Realistic 3D Cover */}
          {!isOpen ? (
            <div
              onClick={() => {
                onToggleOpen(true);
                soundEngine.playBookOpen();
              }}
              className="relative w-1/2 aspect-[0.71/1] max-h-[72vh] rounded-r-xl rounded-l-xs shadow-2xl cursor-pointer group transform transition-all duration-500 hover:scale-[1.015] hover:-translate-y-1"
              style={{
                boxShadow:
                  '20px 25px 50px -10px rgba(0,0,0,0.8), -5px 0 15px rgba(0,0,0,0.5)',
              }}
            >
              {/* Cover Spine Edge */}
              <div className="absolute -left-3 top-0 bottom-0 w-3 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 rounded-l-sm" />

              {/* Cover Image / Canvas */}
              {book.pages[0]?.imageUrl ? (
                <img
                  src={book.pages[0].imageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover rounded-r-xl rounded-l-xs"
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 p-8 flex flex-col justify-between text-amber-200">
                  <h3 className="text-2xl font-bold font-title-custom">{book.title}</h3>
                  <p className="text-sm text-neutral-400">Klik untuk membuka buku</p>
                </div>
              )}

              {/* Realistic Gloss / Leather Sheen on Cover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 rounded-r-xl pointer-events-none" />

              {/* Open Book Prompt Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-r-xl">
                <span className="px-5 py-2.5 bg-neutral-950/90 text-amber-400 font-semibold text-sm rounded-xl border border-amber-500/40 shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <Sparkles size={16} /> Buka Buku & Mulai Membaca
                </span>
              </div>
            </div>
          ) : (
            /* Open Book Dual-Spread or Single Cover Page */
            <div
              className={`relative flex w-full h-full max-h-[74vh] rounded-md transition-all duration-300 ${
                isFirstPageCover ? 'justify-center' : 'justify-center'
              }`}
            >
              {/* Single Front Cover Spread View */}
              {isFirstPageCover ? (
                <div className="relative w-1/2 aspect-[0.71/1] max-h-[72vh] rounded-r-xl shadow-2xl flex">
                  {/* Spine bump on left */}
                  <div className="absolute -left-3 top-0 bottom-0 w-3 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-l-xs" />
                  <div className="relative w-full h-full overflow-hidden rounded-r-xl bg-neutral-900">
                    <img
                      src={book.pages[0]?.imageUrl}
                      alt="Cover Depan"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent pointer-events-none" />

                    {/* Corner Click / Drag Prompt on bottom right */}
                    <div
                      onMouseEnter={() => setHoveredCorner('cover-br')}
                      onMouseLeave={() => setHoveredCorner(null)}
                      onMouseDown={(e) => handleCornerMouseDown(e, 'bottom-right', 'right')}
                      onClick={handleNextPage}
                      className="absolute bottom-0 right-0 w-24 h-24 cursor-pointer group flex items-end justify-end p-3 z-20"
                      title="Klik atau geser untuk membuka halaman pertama"
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-tl from-amber-400/80 to-transparent border-t border-l border-amber-300/60 rounded-tl-2xl shadow-lg transition-transform duration-200 ${
                          hoveredCorner === 'cover-br'
                            ? '-translate-x-3 -translate-y-3 rotate-6'
                            : 'translate-x-3 translate-y-3'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Dual Page Spread (Left Page & Right Page) */
                <div
                  className="relative flex w-full max-w-[1000px] h-full shadow-2xl rounded-sm"
                  style={{
                    boxShadow:
                      '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Outer Hard Cover Trims (Top, Bottom, Outer Edges) */}
                  <div className="absolute -inset-1 bg-neutral-900 rounded-md -z-10 shadow-lg border border-neutral-800" />

                  {/* LEFT PAGE CONTAINER */}
                  <div className="relative flex-1 h-full overflow-hidden bg-[#faf7f2] rounded-l-xs flex flex-col border-r border-neutral-300/40">
                    {leftPage?.imageUrl ? (
                      <img
                        src={leftPage.imageUrl}
                        alt={`Halaman ${leftPage.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full p-8 flex items-center justify-center text-neutral-400">
                        {leftPage ? `Halaman ${leftPage.pageNumber}` : 'Kosong'}
                      </div>
                    )}

                    {/* Left Spine Gutter Gradient Shadow */}
                    <div className="absolute right-0 top-0 bottom-0 w-16 spine-shadow-right pointer-events-none" />

                    {/* Bookmark Ribbon on Left Page if active */}
                    {leftPage && bookmarkedPages.includes(leftPage.pageNumber) && (
                      <div className="absolute top-0 left-10 w-7 h-16 bg-red-700 shadow-md flex items-end justify-center pb-1">
                        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[8px] border-b-[#faf7f2]" />
                      </div>
                    )}

                    {/* Left Page Flip Corner (Bottom-Left) */}
                    <div
                      onMouseEnter={() => setHoveredCorner('left-bl')}
                      onMouseLeave={() => setHoveredCorner(null)}
                      onMouseDown={(e) => handleCornerMouseDown(e, 'bottom-left', 'left')}
                      onClick={handlePrevPage}
                      className="absolute bottom-0 left-0 w-24 h-24 cursor-pointer group flex items-end justify-start p-3 z-20"
                      title="Klik atau geser untuk halaman sebelumnya"
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-tr from-amber-400/70 to-transparent border-t border-r border-amber-300/60 rounded-tr-2xl shadow-md transition-transform duration-200 ${
                          hoveredCorner === 'left-bl'
                            ? 'translate-x-3 -translate-y-3 -rotate-6'
                            : '-translate-x-3 translate-y-3'
                        }`}
                      />
                    </div>
                  </div>

                  {/* CENTER SPINE CREASE & SHADOW (Authentic 3D Depth) */}
                  <div className="relative w-3 h-full z-10 flex-shrink-0 bg-neutral-800/40 book-spine-crease">
                    {/* Spine stitching / wire simulation */}
                    <div className="w-full h-full bg-gradient-to-r from-black/40 via-neutral-900/60 to-black/40" />
                  </div>

                  {/* RIGHT PAGE CONTAINER */}
                  <div className="relative flex-1 h-full overflow-hidden bg-[#faf7f2] rounded-r-xs flex flex-col border-l border-neutral-300/40">
                    {rightPage?.imageUrl ? (
                      <img
                        src={rightPage.imageUrl}
                        alt={`Halaman ${rightPage.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full p-8 flex items-center justify-center text-neutral-400">
                        {rightPage ? `Halaman ${rightPage.pageNumber}` : 'Kosong'}
                      </div>
                    )}

                    {/* Right Spine Gutter Gradient Shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 spine-shadow-left pointer-events-none" />

                    {/* Bookmark Ribbon on Right Page if active */}
                    {rightPage && bookmarkedPages.includes(rightPage.pageNumber) && (
                      <div className="absolute top-0 right-10 w-7 h-16 bg-red-700 shadow-md flex items-end justify-center pb-1">
                        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[8px] border-b-[#faf7f2]" />
                      </div>
                    )}

                    {/* Right Page Flip Corner (Bottom-Right) */}
                    <div
                      onMouseEnter={() => setHoveredCorner('right-br')}
                      onMouseLeave={() => setHoveredCorner(null)}
                      onMouseDown={(e) => handleCornerMouseDown(e, 'bottom-right', 'right')}
                      onClick={handleNextPage}
                      className="absolute bottom-0 right-0 w-24 h-24 cursor-pointer group flex items-end justify-end p-3 z-20"
                      title="Klik atau geser untuk halaman berikutnya"
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-tl from-amber-400/70 to-transparent border-t border-l border-amber-300/60 rounded-tl-2xl shadow-md transition-transform duration-200 ${
                          hoveredCorner === 'right-br'
                            ? '-translate-x-3 -translate-y-3 rotate-6'
                            : 'translate-x-3 translate-y-3'
                        }`}
                      />
                    </div>
                  </div>

                  {/* ACTIVE DRAG PEEL CURL OVERLAY */}
                  {dragState.isDragging && (
                    <div
                      className="absolute inset-y-0 pointer-events-none z-30"
                      style={{
                        right: dragState.side === 'right' ? 0 : 'auto',
                        left: dragState.side === 'left' ? 0 : 'auto',
                        width: `${dragState.progress * 50}%`,
                        background:
                          dragState.side === 'right'
                            ? `linear-gradient(to left, rgba(0,0,0,0.35) 0%, rgba(255,255,255,0.4) 60%, transparent 100%)`
                            : `linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(255,255,255,0.4) 60%, transparent 100%)`,
                        boxShadow:
                          dragState.side === 'right'
                            ? `-15px 0 25px rgba(0,0,0,0.5)`
                            : `15px 0 25px rgba(0,0,0,0.5)`,
                        transformOrigin: dragState.side === 'right' ? 'right center' : 'left center',
                        transform: `skewY(${dragState.side === 'right' ? -4 : 4}deg)`,
                      }}
                    >
                      {/* Paper underside curl simulation */}
                      <div className="w-full h-full bg-[#f4ede1] opacity-90 border-l border-neutral-300" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Side Chevron Navigation Arrows */}
        {isOpen && (
          <>
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3.5 bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-20 text-neutral-200 rounded-2xl border border-neutral-700/80 shadow-2xl transition-all transform hover:scale-105 active:scale-95 z-20 pointer-events-auto"
              title="Halaman Sebelumnya (Panah Kiri)"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= book.totalPages}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3.5 bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-20 text-neutral-200 rounded-2xl border border-neutral-700/80 shadow-2xl transition-all transform hover:scale-105 active:scale-95 z-20 pointer-events-auto"
              title="Halaman Berikutnya (Panah Kanan / Spasi)"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Quick Bottom Status Bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs text-neutral-400/80 flex items-center gap-3 pointer-events-none">
        <span>Klik atau tarik sudut halaman untuk membalik lembaran</span>
        <span>•</span>
        <span>Gunakan tombol panah ◄ ► pada keyboard</span>
      </div>
    </div>
  );
};
