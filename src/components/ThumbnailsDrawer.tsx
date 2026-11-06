import React from 'react';
import { Book } from '../types/book';
import { soundEngine } from '../utils/audio';
import { X, Layers } from 'lucide-react';

interface ThumbnailsDrawerProps {
  book: Book;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ThumbnailsDrawer: React.FC<ThumbnailsDrawerProps> = ({
  book,
  currentPage,
  onPageChange,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900/98 border-t border-neutral-700/80 shadow-2xl p-4 transition-all max-h-[260px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-neutral-100">
            Miniatur Halaman ({book.totalPages} Halaman)
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Horizontal Scroll of Thumbnails */}
      <div className="flex items-center gap-4 overflow-x-auto py-4 px-2 select-none">
        {book.pages.map((page) => {
          const isSelected =
            currentPage === page.pageNumber ||
            (currentPage % 2 === 0 && currentPage + 1 === page.pageNumber) ||
            (currentPage % 2 !== 0 && currentPage - 1 === page.pageNumber);

          return (
            <div
              key={page.pageNumber}
              onClick={() => {
                onPageChange(page.pageNumber);
                soundEngine.playPageFlip('fast');
                onClose();
              }}
              className={`flex-shrink-0 cursor-pointer flex flex-col items-center gap-1.5 group transition-transform ${
                isSelected ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              <div
                className={`relative w-20 aspect-[0.71/1] rounded-sm overflow-hidden border-2 transition shadow-md bg-neutral-800 ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-500/30'
                    : 'border-neutral-700 group-hover:border-neutral-500'
                }`}
              >
                {page.imageUrl ? (
                  <img
                    src={page.imageUrl}
                    alt={`Halaman ${page.pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                    {page.pageNumber}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition" />
              </div>
              <span
                className={`text-[11px] font-mono ${
                  isSelected ? 'text-amber-400 font-bold' : 'text-neutral-400'
                }`}
              >
                Hal. {page.pageNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
