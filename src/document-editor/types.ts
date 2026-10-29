export type PageSettings = {
  size: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: 'narrow' | 'moderate' | 'normal' | 'wide';
};

// CSS pixels at 96 dpi
export const PAGE_SIZES = {
  A4: { w: 794, h: 1123 },
  Letter: { w: 816, h: 1056 },
  Legal: { w: 816, h: 1344 },
} as const;

export const MARGINS = { narrow: 48, moderate: 72, normal: 96, wide: 120 } as const;

export function pageDims(p: PageSettings) {
  const s = PAGE_SIZES[p.size];
  return p.orientation === 'portrait' ? { w: s.w, h: s.h } : { w: s.h, h: s.w };
}

export type SavedDoc = {
  id: string;
  title: string;
  html: string;
  updated: number;
  page: PageSettings;
};

export const DEFAULT_PAGE: PageSettings = { size: 'A4', orientation: 'portrait', margin: 'moderate' };
