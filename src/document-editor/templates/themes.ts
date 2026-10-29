export type Theme = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  light: string;
  head: string; // heading font
  body: string; // body font
};

export type LayoutId = 'banner' | 'classic' | 'accent';

export const LAYOUTS: { id: LayoutId; name: string }[] = [
  { id: 'banner', name: 'Banner' },
  { id: 'classic', name: 'Classic' },
  { id: 'accent', name: 'Accent' },
];

export const THEMES: Theme[] = [
  { id: 'ocean', name: 'Ocean', primary: '#0b5394', accent: '#38bdf8', light: '#eaf3fb', head: 'Poppins', body: 'Lato' },
  { id: 'forest', name: 'Forest', primary: '#1b5e20', accent: '#81c784', light: '#eef7ee', head: 'Merriweather', body: 'Open Sans' },
  { id: 'sunset', name: 'Sunset', primary: '#c2410c', accent: '#fb923c', light: '#fff4ec', head: 'Montserrat', body: 'Roboto' },
  { id: 'royal', name: 'Royal', primary: '#4c1d95', accent: '#a78bfa', light: '#f3effd', head: 'Playfair Display', body: 'Lato' },
  { id: 'slate', name: 'Slate', primary: '#334155', accent: '#94a3b8', light: '#f1f5f9', head: 'Inter', body: 'Inter' },
  { id: 'rose', name: 'Rose', primary: '#be123c', accent: '#fb7185', light: '#fff1f3', head: 'Lora', body: 'Work Sans' },
  { id: 'mono', name: 'Mono', primary: '#111111', accent: '#6b7280', light: '#f5f5f5', head: 'Montserrat', body: 'Roboto' },
  { id: 'teal', name: 'Teal', primary: '#0f766e', accent: '#2dd4bf', light: '#e8f7f5', head: 'Raleway', body: 'Nunito' },
  { id: 'amber', name: 'Amber', primary: '#b45309', accent: '#fbbf24', light: '#fff8e6', head: 'Playfair Display', body: 'Open Sans' },
  { id: 'indigo', name: 'Indigo', primary: '#3730a3', accent: '#818cf8', light: '#eef0ff', head: 'Poppins', body: 'Nunito' },
  { id: 'crimson', name: 'Crimson', primary: '#991b1b', accent: '#f87171', light: '#fdeeee', head: 'Merriweather', body: 'Lato' },
  { id: 'mint', name: 'Mint', primary: '#047857', accent: '#6ee7b7', light: '#eafaf3', head: 'Raleway', body: 'Work Sans' },
];
