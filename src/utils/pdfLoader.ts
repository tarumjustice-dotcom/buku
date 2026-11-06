import * as pdfjsLib from 'pdfjs-dist';
import { Book, PageContent } from '../types/book';

// Set up worker source from reliable CDN matching modern pdfjs
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface PDFLoadProgress {
  loaded: number;
  total: number;
  status: string;
}

/**
 * Loads a PDF file from an ArrayBuffer or File and renders each page to a high-res canvas.
 */
export async function loadPDFBook(
  source: File | ArrayBuffer,
  fileName?: string,
  onProgress?: (progress: PDFLoadProgress) => void
): Promise<Book> {
  const arrayBuffer = source instanceof File ? await source.arrayBuffer() : source;
  const name = fileName || (source instanceof File ? source.name.replace(/\.[^/.]+$/, '') : 'Buku PDF Unggahan');

  onProgress?.({ loaded: 0, total: 100, status: 'Membaca dokumen PDF...' });

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const pages: PageContent[] = [];
  const toc: { title: string; pageNumber: number }[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({
      loaded: pageNum,
      total: totalPages,
      status: `Memproses & merender halaman ${pageNum} dari ${totalPages}...`,
    });

    const page = await pdfDoc.getPage(pageNum);
    
    // Calculate scale for sharp rendering (2.0 for retina clarity)
    const initialViewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(2.0, 1400 / initialViewport.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // White background base for PDF pages
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas,
      };

      await page.render(renderContext).promise;
    }

    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);

    pages.push({
      pageNumber: pageNum,
      title: pageNum === 1 ? 'Sampul Dokumen' : `Halaman ${pageNum}`,
      renderedCanvas: canvas,
      imageUrl,
      isCover: pageNum === 1,
      isBackCover: pageNum === totalPages,
      textSnippet: `Halaman ${pageNum} dari ${name}`,
    });

    if (pageNum === 1 || pageNum % 5 === 0 || pageNum === totalPages) {
      toc.push({
        title: pageNum === 1 ? 'Sampul Depan' : pageNum === totalPages ? 'Halaman Terakhir' : `Bagian Halaman ${pageNum}`,
        pageNumber: pageNum,
      });
    }
  }

  return {
    id: `custom-pdf-${Date.now()}`,
    title: name,
    author: 'Dokumen Pengguna',
    description: `Buku PDF yang diunggah (${totalPages} halaman) siap dibaca dengan simulasi pembalik halaman realistis.`,
    coverImage: pages[0]?.imageUrl,
    totalPages,
    pages,
    toc,
    themeColor: '#3b82f6',
  };
}
