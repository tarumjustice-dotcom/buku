import React, { useState } from 'react';
import { Book } from '../types/book';
import { soundEngine } from '../utils/audio';
import { X, Search, BookOpen, ChevronRight } from 'lucide-react';

interface TableOfContentsModalProps {
  book: Book;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TableOfContentsModal: React.FC<TableOfContentsModalProps> = ({
  book,
  currentPage,
  onPageChange,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredTOC = book.toc.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.pageNumber).includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 pointer-events-auto">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-neutral-100 font-title-custom">
                Daftar Isi
              </h3>
              <p className="text-xs text-neutral-400">{book.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Cari bab atau nomor halaman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTOC.length > 0 ? (
            filteredTOC.map((item, index) => {
              const isCurrent =
                currentPage === item.pageNumber ||
                (currentPage % 2 === 0 && currentPage + 1 === item.pageNumber);

              return (
                <button
                  key={index}
                  onClick={() => {
                    onPageChange(item.pageNumber);
                    soundEngine.playPageFlip();
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition group ${
                    isCurrent
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                      : 'hover:bg-neutral-800/70 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-amber-400/80 w-6">
                      {String(item.pageNumber).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-medium group-hover:text-amber-300 transition">
                      {item.title}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-neutral-500 group-hover:text-neutral-200 transition"
                  />
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-neutral-500">
              Tidak ada bab yang cocok dengan kata kunci.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/50 border-t border-neutral-800 text-center text-[11px] text-neutral-400">
          Total {book.totalPages} halaman dalam buku ini
        </div>
      </div>
    </div>
  );
};
