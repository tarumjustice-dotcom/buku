export interface PageContent {
  pageNumber: number;
  title?: string;
  imageUrl?: string;
  renderedCanvas?: HTMLCanvasElement;
  textSnippet?: string;
  isCover?: boolean;
  isBackCover?: boolean;
}

export interface TableOfContentItem {
  title: string;
  pageNumber: number;
  subtitle?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage?: string;
  totalPages: number;
  pages: PageContent[];
  toc: TableOfContentItem[];
  themeColor?: string;
}

export type ViewMode = 'fliphtml5' | 'three3d';

export type AmbianceTheme = 'studio-dark' | 'walnut-library' | 'nordic-slate' | 'midnight-cosmic';

export interface ReaderSettings {
  soundEnabled: boolean;
  volume: number;
  autoPlay: boolean;
  autoPlaySpeedSec: number;
  zoomLevel: number;
  doublePage: boolean;
  ambiance: AmbianceTheme;
  flipSpeed: 'slow' | 'normal' | 'fast';
}
