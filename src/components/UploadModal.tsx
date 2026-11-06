import React, { useState, useRef } from 'react';
import { Book } from '../types/book';
import { loadPDFBook, PDFLoadProgress } from '../utils/pdfLoader';
import { getSampleBooks } from '../data/sampleBooks';
import { soundEngine } from '../utils/audio';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Library,
  Sparkles,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookLoaded: (newBook: Book) => void;
  currentBookId: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onBookLoaded,
  currentBookId,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<PDFLoadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const sampleBooks = getSampleBooks();

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Silakan pilih berkas dokumen berformat PDF.');
      return;
    }

    setErrorMessage(null);
    setLoadingProgress({ loaded: 0, total: 100, status: 'Mempersiapkan dokumen PDF...' });

    try {
      const book = await loadPDFBook(file, file.name, (progress) => {
        setLoadingProgress(progress);
      });
      soundEngine.playBookOpen();
      onBookLoaded(book);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(
        'Gagal membaca file PDF. Pastikan file tidak terkunci dengan kata sandi.'
      );
    } finally {
      setLoadingProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (book: Book) => {
    soundEngine.playBookOpen();
    onBookLoaded(book);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 pointer-events-auto">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <UploadCloud size={20} className="text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-neutral-100 font-title-custom">
                Buka & Unggah Dokumen PDF
              </h3>
              <p className="text-xs text-neutral-400">
                Pilih PDF Anda sendiri atau gunakan koleksi buku bawaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-neutral-700 hover:border-amber-500/60 hover:bg-neutral-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-3 text-amber-400">
              <FileText size={22} />
            </div>

            <p className="text-sm font-medium text-neutral-200 mb-1">
              Tarik & Letakkan file PDF di sini, atau{' '}
              <span className="text-amber-400 underline underline-offset-2">pilih dari komputer</span>
            </p>
            <p className="text-xs text-neutral-500">
              Mendukung semua berkas PDF multi-halaman dengan rendering kanvas tajam
            </p>
          </div>

          {/* Loading Progress State */}
          {loadingProgress && (
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">{loadingProgress.status}</span>
                <span className="font-mono text-amber-400">
                  {Math.round((loadingProgress.loaded / Math.max(1, loadingProgress.total)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, (loadingProgress.loaded / Math.max(1, loadingProgress.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preset Sample Books Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Library size={14} className="text-amber-400" />
              <span>Pilihan Buku Bawaan (Siap Baca)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sampleBooks.map((sample) => {
                const isCurrent = sample.id === currentBookId;

                return (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-500/15'
                        : 'border-neutral-700/80 bg-neutral-800/40 hover:bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div>
                      <div className="aspect-[1.3/1] rounded-lg overflow-hidden mb-2 bg-neutral-900 border border-neutral-800">
                        {sample.coverImage && (
                          <img
                            src={sample.coverImage}
                            alt={sample.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-neutral-200 line-clamp-1 group-hover:text-amber-300">
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                        {sample.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{sample.totalPages} Halaman</span>
                      {isCurrent ? (
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={11} /> Sedang Aktif
                        </span>
                      ) : (
                        <span className="text-neutral-500 group-hover:text-neutral-300">Buka</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950/60 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
