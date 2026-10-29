import type { Editor } from '@tiptap/react';
import { MARGINS, PAGE_SIZES, type PageSettings } from '../types';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@400;700&family=Roboto:wght@400;700&family=Montserrat:wght@400;700&family=Lato:wght@400;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Open+Sans:wght@400;700&family=Raleway:wght@400;700&family=Lora:wght@400;700&family=Work+Sans:wght@400;700&family=Nunito:wght@400;700&display=swap';

const BASE_CSS = `
  body{font-family:Lato,Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4;color:#111827}
  p{margin:0 0 8px} h1,h2,h3,h4{margin:14px 0 6px}
  table{border-collapse:collapse;width:100%} td,th{border:1px solid #d1d5db;padding:6px 8px;vertical-align:top}
  img{max-width:100%;height:auto} blockquote{border-left:4px solid #d1d5db;margin:8px 0;padding-left:12px;color:#4b5563}
  mark{background:#fde68a} a{color:#2563eb} div[data-page-break]{page-break-after:always;height:0}
  ul[data-type="taskList"]{list-style:none;padding-left:4px}
`;

export function standaloneHtml(title: string, body: string, page: PageSettings) {
  const m = MARGINS[page.margin];
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/</g, '&lt;')}</title>
<link href="${FONT_LINK}" rel="stylesheet"><style>@page{size:${page.size} ${page.orientation};margin:${m}px}${BASE_CSS}</style></head>
<body>${body}</body></html>`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Keep letters/digits/basic punctuation only: characters such as "·" make some browsers drop the whole filename.
const safeName = (t: string) =>
  (t.replace(/[^\p{L}\p{N} ._()-]+/gu, '-').replace(/\s+/g, ' ').trim() || 'document').slice(0, 80);

export function exportHtml(editor: Editor, title: string, page: PageSettings) {
  const html = standaloneHtml(title, editor.getHTML(), page);
  download(new Blob([html], { type: 'text/html;charset=utf-8' }), `${safeName(title)}.html`);
}

export function exportText(editor: Editor, title: string) {
  const text = editor.getText({ blockSeparator: '\n\n' });
  download(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${safeName(title)}.txt`);
}

/** Opens in Word as a classic .doc (HTML-based). */
export function exportDoc(editor: Editor, title: string, page: PageSettings) {
  const html = standaloneHtml(title, editor.getHTML(), page);
  download(new Blob(['﻿', html], { type: 'application/msword' }), `${safeName(title)}.doc`);
}

/**
 * Real .docx file (native Word paragraphs, tables, lists, images) so it opens in Word, Google Docs and LibreOffice.
 * It is generated from the HTML, so very complex designs may look slightly different from the editor.
 */
export async function exportDocx(editor: Editor, title: string, page: PageSettings) {
  const mod: any = await import('@turbodocx/html-to-docx');
  const htmlToDocx = mod.default ?? mod;
  const m = MARGINS[page.margin] * 15; // px -> twips (1px = 15 twips)
  const base = PAGE_SIZES[page.size]; // portrait size; the library swaps for landscape

  // Cells marked "borderless" in the editor need an explicit style for Word.
  const doc = new DOMParser().parseFromString(`<body>${editor.getHTML()}</body>`, 'text/html');
  doc.querySelectorAll<HTMLElement>('td[data-borderless], th[data-borderless]').forEach((c) => {
    c.style.border = 'none';
  });

  // Banner headers are consecutive shaded paragraphs; Word would shade each text line separately,
  // so wrap each such run in a one-cell shaded table to keep the full-width block.
  const isBlock = (el: Element | undefined): el is HTMLElement => !!el && /^(P|H[1-6])$/.test(el.tagName);
  const kids = Array.from(doc.body.children);
  for (let i = 0; i < kids.length; ) {
    const first = kids[i] as HTMLElement;
    const bg = isBlock(first) ? first.style.backgroundColor : '';
    if (!bg) {
      i++;
      continue;
    }
    let j = i + 1;
    while (isBlock(kids[j]) && (kids[j] as HTMLElement).style.backgroundColor === bg) j++;
    if (j - i >= 2) {
      const table = doc.createElement('table');
      table.style.width = '100%';
      const td = doc.createElement('td');
      td.style.backgroundColor = bg;
      td.style.border = 'none';
      td.style.padding = '12px 16px';
      table.appendChild(doc.createElement('tbody')).appendChild(doc.createElement('tr')).appendChild(td);
      first.before(table);
      for (let k = i; k < j; k++) {
        const el = kids[k] as HTMLElement;
        el.style.backgroundColor = '';
        el.style.padding = '';
        td.appendChild(el);
      }
    }
    i = j;
  }

  const out = await htmlToDocx(doc.body.innerHTML, null, {
    orientation: page.orientation,
    margins: { top: m, right: m, bottom: m, left: m },
    pageSize: { width: base.w * 15, height: base.h * 15 },
    font: 'Calibri',
    fontSize: 22, // half-points -> 11pt
    title,
    table: { row: { cantSplit: true } },
  });
  const blob =
    out instanceof Blob
      ? out
      : new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  download(blob, `${safeName(title)}.docx`);
}

/** Reads a .docx and returns HTML for the editor. */
export async function importDocx(file: File): Promise<string> {
  const mod: any = await import('mammoth');
  const convert = mod.convertToHtml ?? mod.default?.convertToHtml;
  const arrayBuffer = await file.arrayBuffer();
  const result = await convert({ arrayBuffer });
  return result.value as string;
}
