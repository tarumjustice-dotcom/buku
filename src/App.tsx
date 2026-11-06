import React, { useState, useEffect } from 'react';
import { Book, ViewMode, AmbianceTheme } from './types/book';
import { getSampleBooks } from './data/sampleBooks';
import { FlipBookReader } from './components/FlipBookReader';
import { ThreeBookViewer } from './components/ThreeBookViewer';
import { NavigationDock } from './components/NavigationDock';
import { TableOfContentsModal } from './components/TableOfContentsModal';
import { ThumbnailsDrawer } from './components/ThumbnailsDrawer';
import { UploadModal } from './components/UploadModal';
import { AIBookCompanion } from './components/AIBookCompanion';
import { soundEngine } from './utils/audio';

export default function App() {
  const sampleBooks = getSampleBooks();
  const [activeBook, setActiveBook] = useState<Book>(sampleBooks[0]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('fliphtml5');
  const [ambiance, setAmbiance] = useState<AmbianceTheme>('studio-dark');

  // Modals & Panels
  const [showTOC, setShowTOC] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [showAICompanion, setShowAICompanion] = useState<boolean>(false);

  // Background ambiance style
  const getAmbianceBackground = () => {
    switch (ambiance) {
      case 'walnut-library':
        return 'bg-[#150f0c] text-neutral-100';
      case 'nordic-slate':
        return 'bg-[#0f172a] text-neutral-100';
      case 'midnight-cosmic':
        return 'bg-[#080816] text-neutral-100';
      case 'studio-dark':
      default:
        return 'bg-neutral-950 text-neutral-100';
    }
  };

  const handleBookChange = (newBook: Book) => {
    setActiveBook(newBook);
    setCurrentPage(1);
    setIsOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(activeBook.totalPages, newPage)));
  };

  // Global hotkeys
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'o' || e.key === 'O') {
        const next = !isOpen;
        setIsOpen(next);
        if (next) soundEngine.playBookOpen();
        else soundEngine.playBookClose();
      } else if (e.key === 'm' || e.key === 'M') {
        setViewMode((prev) => (prev === 'fliphtml5' ? 'three3d' : 'fliphtml5'));
      } else if (e.key === 't' || e.key === 'T') {
        setShowTOC((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowTOC(false);
        setShowThumbnails(false);
        setShowUpload(false);
        setShowAICompanion(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen]);

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden flex flex-col ${getAmbianceBackground()} transition-colors duration-500`}
    >
      {/* Dynamic Background Atmosphere Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {ambiance === 'walnut-library' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-amber-900/15 blur-[140px] rounded-full" />
        )}
        {ambiance === 'nordic-slate' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-sky-900/15 blur-[140px] rounded-full" />
        )}
        {ambiance === 'midnight-cosmic' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-indigo-900/20 blur-[140px] rounded-full" />
        )}
        {ambiance === 'studio-dark' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] bg-neutral-800/20 blur-[130px] rounded-full" />
        )}
      </div>

      {/* Primary Viewer Workspace */}
      <div className="relative flex-1 w-full h-full">
        {viewMode === 'fliphtml5' ? (
          <FlipBookReader
            book={activeBook}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            isOpen={isOpen}
            onToggleOpen={setIsOpen}
            onOpenAICompanion={() => setShowAICompanion(true)}
            onOpenTOC={() => setShowTOC(true)}
            onOpenThumbnails={() => setShowThumbnails(true)}
          />
        ) : (
          <ThreeBookViewer
            book={activeBook}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            isOpen={isOpen}
            onToggleOpen={setIsOpen}
          />
        )}
      </div>

      {/* Unified Bottom Navigation Dock */}
      <NavigationDock
        book={activeBook}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isOpen={isOpen}
        onToggleOpen={setIsOpen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenTOC={() => setShowTOC(true)}
        onOpenThumbnails={() => setShowThumbnails(true)}
        onOpenUpload={() => setShowUpload(true)}
        ambiance={ambiance}
        onAmbianceChange={setAmbiance}
      />

      {/* Modals & Drawers */}
      <TableOfContentsModal
        book={activeBook}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isOpen={showTOC}
        onClose={() => setShowTOC(false)}
      />

      <ThumbnailsDrawer
        book={activeBook}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
      />

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onBookLoaded={handleBookChange}
        currentBookId={activeBook.id}
      />

      <AIBookCompanion
        book={activeBook}
        currentPage={currentPage}
        isOpen={showAICompanion}
        onClose={() => setShowAICompanion(false)}
      />
    </main>
  );
}
