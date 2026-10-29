import { Extension, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { SearchReplace } from './search';
import { DocumentLine } from './DocumentLine';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    lineHeight: {
      setLineHeight: (value: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
    cellShade: {
      setCellShade: (color: string | null) => ReturnType;
    };
  }
}

/* ---------- font size (stored on the textStyle mark) ---------- */
export const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (a) => (a.fontSize ? { style: `font-size:${a.fontSize}` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/* ---------- line spacing ---------- */
export const LineHeight = Extension.create({
  name: 'lineHeight',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (a) => (a.lineHeight ? { style: `line-height:${a.lineHeight}` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (value) =>
        ({ commands }) =>
          ['paragraph', 'heading'].map((t) => commands.updateAttributes(t, { lineHeight: value })).some(Boolean),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          ['paragraph', 'heading'].map((t) => commands.resetAttributes(t, 'lineHeight')).some(Boolean),
    };
  },
});

/* ---------- indent / outdent (36px per level, like Word) ---------- */
const INDENT_PX = 36;
const MAX_INDENT = 8;

export const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => Math.round((parseInt(el.style.marginLeft, 10) || 0) / INDENT_PX) || 0,
            renderHTML: (a) => (a.indent ? { style: `margin-left:${a.indent * INDENT_PX}px` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    const shift =
      (delta: number) =>
      () =>
      ({ state, tr, dispatch }: { state: any; tr: any; dispatch?: (tr: any) => void }) => {
        const { from, to } = state.selection;
        let changed = false;
        state.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const cur = node.attrs.indent || 0;
            const next = Math.min(MAX_INDENT, Math.max(0, cur + delta));
            if (next !== cur) {
              changed = true;
              if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            }
          }
        });
        return changed;
      };
    return { indent: shift(1), outdent: shift(-1) };
  },
  addKeyboardShortcuts() {
    return {
      'Mod-]': () => this.editor.commands.indent(),
      'Mod-[': () => this.editor.commands.outdent(),
    };
  },
});

/* ---------- keep inline block styling that templates rely on ---------- */
const strip = (style: string | null, props: string[]) => {
  if (!style) return null;
  const kept = style
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((d) => !props.includes(d.split(':')[0].trim().toLowerCase()));
  return kept.length ? kept.join(';') : null;
};

export const BlockStyle = Extension.create({
  name: 'blockStyle',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'table', 'blockquote', 'bulletList', 'orderedList', 'taskList'],
        attributes: {
          blockStyle: {
            default: null,
            parseHTML: (el) => strip(el.getAttribute('style'), ['text-align', 'line-height', 'margin-left']),
            renderHTML: (a) => (a.blockStyle ? { style: a.blockStyle } : {}),
          },
        },
      },
      {
        types: ['tableCell', 'tableHeader'],
        attributes: {
          blockStyle: {
            default: null,
            parseHTML: (el) => strip(el.getAttribute('style'), ['background-color', 'background']),
            renderHTML: (a) => (a.blockStyle ? { style: a.blockStyle } : {}),
          },
        },
      },
    ];
  },
});

/* ---------- page break ---------- */
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-page-break]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-page-break': 'true', class: 'page-break' })];
  },
  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).run(),
    };
  },
});

/* ---------- table cells with shading ---------- */
const shadeAttr = {
  background: {
    default: null,
    parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
    renderHTML: (a: Record<string, any>) => (a.background ? { style: `background-color:${a.background}` } : {}),
  },
};

const CellWithShade = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...shadeAttr };
  },
});

const HeaderWithShade = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...shadeAttr };
  },
});

export const CellShade = Extension.create({
  name: 'cellShade',
  addCommands() {
    return {
      setCellShade:
        (color) =>
        ({ commands }) =>
          commands.setCellAttribute('background', color),
    };
  },
});

/* ---------- resizable images ---------- */
const ImageWithWidth = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('width') || el.style.width || null,
        renderHTML: (a: Record<string, any>) =>
          a.width ? { style: `width:${a.width};max-width:100%;height:auto` } : {},
      },
    };
  },
}).configure({ allowBase64: true });

/* ---------- everything together ---------- */
export function buildExtensions() {
  return [
    StarterKit.configure({
  heading: { levels: [1, 2, 3, 4] },
  horizontalRule: false,
}),
    Underline,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    LineHeight,
    Indent,
    BlockStyle,
    Link.configure({ openOnClick: false, autolink: true }),
    ImageWithWidth,
    Table.configure({ resizable: true }),
    TableRow,
    HeaderWithShade,
    CellWithShade,
    CellShade,
    DocumentLine,
    TaskList,
    TaskItem.configure({ nested: true }),
    PageBreak,
    Typography,
    CharacterCount,
    Placeholder.configure({ placeholder: 'Start typing, or pick a template from the gallery…' }),
    SearchReplace,
  ];
}
