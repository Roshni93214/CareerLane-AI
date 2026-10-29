
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Redo2,
  Search,
  SeparatorHorizontal,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  TextQuote,
  Underline,
  Undo2,
} from 'lucide-react';
import { MARGINS, type PageSettings } from '../types';
import { NodeSelection } from '@tiptap/pm/state';

export const FONT_LIST = [
  'Arial', 'Calibri', 'Cambria', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana',
  'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Lato', 'Playfair Display', 'Merriweather',
  'Open Sans', 'Raleway', 'Lora', 'Work Sans', 'Nunito',
];

const SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 60, 72];

const PALETTE_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#d9d9d9', '#f3f3f3', '#ffffff',
  '#980000', '#e06666', '#f4cccc', '#fce5cd', '#f9cb9c', '#f6b26b', '#e69138', '#b45f06',
  '#783f04', '#7f6000', '#bf9000', '#f1c232', '#ffe599', '#ffff00', '#d9ead3', '#b6d7a8',
  '#93c47d', '#6aa84f', '#38761d', '#274e13', '#d0e0e3', '#a2c4c9', '#76a5af', '#45818e',
  '#134f5c', '#c9daf8', '#a4c2f4', '#6d9eeb', '#3c78d8', '#1155cc', '#1c4587', '#cfe2f3',
  '#9fc5e8', '#6fa8dc', '#3d85c6', '#0b5394', '#d9d2e9', '#b4a7d6', '#8e7cc3', '#674ea7',
  '#351c75', '#ead1dc', '#d5a6bd', '#c27ba0', '#a64d79', '#741b47', '#f4cccc', '#ea9999',
];

const SYMBOLS = ['©', '®', '™', '€', '₹', '£', '°', '±', '×', '÷', '•', '→', '←', '↑', '↓', '✓', '✗', '★', '½', '¼', '¾', '§', '¶', '≠', '≤', '≥', '∞'];

type Props = {
  editor: Editor;
  page: PageSettings;
  setPage: (p: PageSettings) => void;
  guides: boolean;
  setGuides: (b: boolean) => void;
  spell: boolean;
  setSpell: (b: boolean) => void;
  onFind: () => void;
};

/** Convert common CSS colours into #rrggbb for input[type=color]. */
function toHex(v: string | null | undefined, fallback: string) {
  if (!v) return fallback;
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;

  const m = v.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (!m) return fallback;

  return '#' + [m[1], m[2], m[3]]
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('');
}

/* ---------- small UI parts ---------- */

function Btn(p: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={p.title}
      aria-label={p.title}
      className={'rb' + (p.active ? ' on' : '')}
      disabled={p.disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={p.onClick}
    >
      {p.children}
    </button>
  );
}

const Sep = () => <span className="rsep" />;

function ColorBtn(p: {
  title: string;
  icon: ReactNode;
  value: string;
  onPick: (c: string) => void;
  onClear: () => void;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <span className="rcolor" title={p.title}>
      <label className="rb" title={p.title}>
        {p.icon}
        <span className="rbar" style={{ background: p.value }} />
        <input
          type="color"
          value={p.value}
          aria-label={p.title}
          onChange={(e) => p.onPick(e.target.value)}
        />
      </label>

      <button
        type="button"
        className="rpalette-toggle rb"
        title={`Choose ${p.title.toLowerCase()} from palette`}
        aria-label={`Choose ${p.title.toLowerCase()} from palette`}
        aria-expanded={paletteOpen}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setPaletteOpen((open) => !open)}
      >
        ▾
      </button>

      <button
        type="button"
        className="rx"
        title={`Reset ${p.title.toLowerCase()}`}
        aria-label={`Reset ${p.title.toLowerCase()}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          p.onClear();
          setPaletteOpen(false);
        }}
      >
        ×
      </button>

      {paletteOpen && (
        <>
          <div className="rbackdrop" onClick={() => setPaletteOpen(false)} />
          <div className="rpalette" role="group" aria-label={`${p.title} palette`}>
            <span className="rpalette-title">Theme colours</span>
            <div className="rpalette-grid">
              {PALETTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="rpalette-swatch"
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Apply ${color}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    p.onPick(color);
                    setPaletteOpen(false);
                  }}
                />
              ))}
            </div>
            <p className="rpalette-note">
              Use the coloured icon to choose any custom colour.
            </p>
          </div>
        </>
      )}
    </span>
  );
}

function TablePicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState<[number, number]>([0, 0]);

  return (
    <span className="rpop">
      <Btn title="Insert table" onClick={() => setOpen((o) => !o)} active={open}>
        <Table2 size={16} />
      </Btn>

      {open && (
        <>
          <div className="rbackdrop" onClick={() => setOpen(false)} />
          <div className="rmenu tgrid">
            <div className="tgrid-cells" onMouseLeave={() => setHov([0, 0])}>
              {Array.from({ length: 8 }).map((_, r) =>
                Array.from({ length: 10 }).map((__, c) => (
                  <i
                    key={`${r}-${c}`}
                    className={r < hov[0] && c < hov[1] ? 'hot' : ''}
                    onMouseEnter={() => setHov([r + 1, c + 1])}
                    onClick={() => {
                      onPick(r + 1, c + 1);
                      setOpen(false);
                    }}
                  />
                )),
              )}
            </div>
            <div className="tgrid-label">
              {hov[0] ? `${hov[0]} × ${hov[1]} table` : 'Pick table size'}
            </div>
          </div>
        </>
      )}
    </span>
  );
}

/** Detect font and size at the active caret position. */
function computedAtCaret(editor: Editor) {
  try {
    const { from } = editor.state.selection;
    const { node } = editor.view.domAtPos(from);
    const el = (
      node.nodeType === 3 ? node.parentElement : (node as HTMLElement)
    ) as HTMLElement | null;

    if (!el) return null;

    const cs = getComputedStyle(el);

    return {
      family: cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
      px: parseFloat(cs.fontSize),
    };
  } catch {
    return null;
  }
}

/* ---------- the ribbon ---------- */

export default function Ribbon({
  editor,
  page,
  setPage,
  guides,
  setGuides,
  spell,
  setSpell,
  onFind,
}: Props) {
  const [tab, setTab] = useState<
    'home' | 'insert' | 'table' | 'layout' | 'review' | 'line'
  >('home');

  const fileRef = useRef<HTMLInputElement>(null);

  const run = (fn: (c: ReturnType<Editor['chain']>) => any) =>
    fn(editor.chain().focus()).run();

  // Refresh ribbon state when the editor selection changes.
  const [, refreshSelection] = useState(0);

  useEffect(() => {
    const refresh = () => refreshSelection((value) => value + 1);

    editor.on('selectionUpdate', refresh);
    editor.on('transaction', refresh);

    return () => {
      editor.off('selectionUpdate', refresh);
      editor.off('transaction', refresh);
    };
  }, [editor]);

  const ts = editor.getAttributes('textStyle');
  const comp = computedAtCaret(editor);

  const family: string = (ts.fontFamily || comp?.family || 'Lato')
    .replace(/['"]/g, '');

  const px = ts.fontSize
    ? parseFloat(ts.fontSize) * (String(ts.fontSize).endsWith('pt') ? 4 / 3 : 1)
    : comp?.px ?? 14.67;

  const pt = Math.round(px * 0.75 * 2) / 2;

  const fonts = FONT_LIST.includes(family) ? FONT_LIST : [family, ...FONT_LIST];
  const sizes = SIZES.includes(pt) ? SIZES : [...SIZES, pt].sort((a, b) => a - b);

  const stepSize = (dir: 1 | -1) => {
    const idx = sizes.indexOf(pt);
    const next = sizes[Math.min(sizes.length - 1, Math.max(0, idx + dir))];

    run((c) => c.setFontSize(`${next}pt`));
  };

  const block = editor.isActive('heading', { level: 1 }) ? 'h1'
    : editor.isActive('heading', { level: 2 }) ? 'h2'
    : editor.isActive('heading', { level: 3 }) ? 'h3'
    : editor.isActive('heading', { level: 4 }) ? 'h4'
    : editor.isActive('blockquote') ? 'quote'
    : editor.isActive('codeBlock') ? 'code' : 'p';

  const setBlock = (v: string) => {
    const c = editor.chain().focus();

    if (v === 'p') c.setParagraph().run();
    else if (v === 'quote') c.toggleBlockquote().run();
    else if (v === 'code') c.toggleCodeBlock().run();
    else c.setHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 }).run();
  };

  const onImage = (file?: File) => {
    if (!file) return;

    const r = new FileReader();

    r.onload = () => run((c) => c.setImage({ src: String(r.result) }));
    r.readAsDataURL(file);
  };

  const setLink = () => {
    const prev = editor.getAttributes('link').href || 'https://';
    const url = window.prompt('Link address', prev);

    if (url === null) return;

    if (url === '') run((c) => c.unsetLink());
    else run((c) => c.extendMarkRange('link').setLink({ href: url }));
  };

const inTable = editor.isActive('table');

const linePositionRef = useRef<number | null>(null);
const [, refreshLineControls] = useState(0);

useEffect(() => {
  const rememberSelection = () => {
    const selection = editor.state.selection;

    if (
      selection instanceof NodeSelection &&
      selection.node.type.name === 'documentLine'
    ) {
      linePositionRef.current = selection.from;
    } else if (editor.view.hasFocus()) {
      linePositionRef.current = null;
    }

    refreshLineControls((value) => value + 1);
  };

  editor.on('selectionUpdate', rememberSelection);
  editor.on('transaction', rememberSelection);

  rememberSelection();

  return () => {
    editor.off('selectionUpdate', rememberSelection);
    editor.off('transaction', rememberSelection);
  };
}, [editor]);

const selectedLinePos = linePositionRef.current;

const selectedLineNode =
  selectedLinePos !== null
    ? editor.state.doc.nodeAt(selectedLinePos)
    : null;

const lineActive =
  editor.isActive('documentLine') ||
  selectedLineNode?.type.name === 'documentLine';

const lineAttrs =
  selectedLineNode?.type.name === 'documentLine'
    ? selectedLineNode.attrs
    : editor.getAttributes('documentLine');

const updateLineAttributes = (
  changes: Record<string, unknown>,
) => {
  const pos = linePositionRef.current;
  const node = pos !== null ? editor.state.doc.nodeAt(pos) : null;

  if (
    pos !== null &&
    node &&
    node.type.name === 'documentLine'
  ) {
    const transaction = editor.state.tr.setNodeMarkup(
      pos,
      undefined,
      {
        ...node.attrs,
        ...changes,
      },
    );

    editor.view.dispatch(transaction);
    return;
  }

  editor.chain().focus().updateAttributes(
    'documentLine',
    changes,
  ).run();
};
  useEffect(() => {
    if (!lineActive && tab === 'line') setTab('home');
  }, [lineActive, tab]);

  const color = toHex(ts.color, '#000000');
  const hl = toHex(editor.getAttributes('highlight').color, '#fde047');
  const lh =
    editor.getAttributes('paragraph').lineHeight ||
    editor.getAttributes('heading').lineHeight ||
    '';
  const img = editor.isActive('image');

  return (
    <div className="ribbon">
      <div className="rtabs">
        {(['home', 'insert', 'table', 'layout', 'review'] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? 'on' : ''}
            onClick={() => setTab(t)}
          >
            {t === 'table' ? 'Table' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}

        {lineActive && (
          <button
            type="button"
            className={tab === 'line' ? 'on' : ''}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setTab('line')}
          >
            Line Format
          </button>
        )}
      </div>

      <div className="rbody">
        {/* ------------------------------ HOME ------------------------------ */}
        {tab === 'home' && (
          <>
            <Btn title="Undo (Ctrl+Z)" onClick={() => run((c) => c.undo())} disabled={!editor.can().undo()}>
              <Undo2 size={16} />
            </Btn>
            <Btn title="Redo (Ctrl+Y)" onClick={() => run((c) => c.redo())} disabled={!editor.can().redo()}>
              <Redo2 size={16} />
            </Btn>
            <Sep />

            <select
              className="rsel wide"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              title="Paragraph style"
            >
              <option value="p">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="quote">Quote</option>
              <option value="code">Code block</option>
            </select>

            <select
              className="rsel wide"
              value={family}
              onChange={(e) => run((c) => c.setFontFamily(e.target.value))}
              title="Font"
              style={{ fontFamily: family }}
            >
              {fonts.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>

            <select
              className="rsel narrow"
              value={pt}
              onChange={(e) => run((c) => c.setFontSize(`${e.target.value}pt`))}
              title="Font size (pt)"
            >
              {sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <Btn title="Increase font size" onClick={() => stepSize(1)}>
              <b style={{ fontSize: 14 }}>A<sup>+</sup></b>
            </Btn>
            <Btn title="Decrease font size" onClick={() => stepSize(-1)}>
              <b style={{ fontSize: 11 }}>A<sup>−</sup></b>
            </Btn>
            <Sep />

            <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => run((c) => c.toggleBold())}>
              <Bold size={16} />
            </Btn>
            <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => run((c) => c.toggleItalic())}>
              <Italic size={16} />
            </Btn>
            <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => run((c) => c.toggleUnderline())}>
              <Underline size={16} />
            </Btn>
            <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => run((c) => c.toggleStrike())}>
              <Strikethrough size={16} />
            </Btn>
            <Btn title="Subscript" active={editor.isActive('subscript')} onClick={() => run((c) => c.toggleSubscript())}>
              <Subscript size={16} />
            </Btn>
            <Btn title="Superscript" active={editor.isActive('superscript')} onClick={() => run((c) => c.toggleSuperscript())}>
              <Superscript size={16} />
            </Btn>

            <ColorBtn
              title="Text color"
              icon={<span className="rA">A</span>}
              value={color}
              onPick={(v) => run((c) => c.setColor(v))}
              onClear={() => run((c) => c.unsetColor())}
            />
            <ColorBtn
              title="Highlight"
              icon={<Highlighter size={16} />}
              value={hl}
              onPick={(v) => run((c) => c.setHighlight({ color: v }))}
              onClear={() => run((c) => c.unsetHighlight())}
            />
            <Btn title="Clear formatting" onClick={() => run((c) => c.unsetAllMarks().clearNodes())}>
              <Eraser size={16} />
            </Btn>
            <Sep />

            <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => run((c) => c.setTextAlign('left'))}>
              <AlignLeft size={16} />
            </Btn>
            <Btn title="Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => run((c) => c.setTextAlign('center'))}>
              <AlignCenter size={16} />
            </Btn>
            <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => run((c) => c.setTextAlign('right'))}>
              <AlignRight size={16} />
            </Btn>
            <Btn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => run((c) => c.setTextAlign('justify'))}>
              <AlignJustify size={16} />
            </Btn>
            <Sep />

            <Btn title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => run((c) => c.toggleBulletList())}>
              <List size={16} />
            </Btn>
            <Btn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => run((c) => c.toggleOrderedList())}>
              <ListOrdered size={16} />
            </Btn>
            <Btn title="Checklist" active={editor.isActive('taskList')} onClick={() => run((c) => c.toggleTaskList())}>
              <ListChecks size={16} />
            </Btn>
            <Btn title="Decrease indent (Ctrl+[)" onClick={() => (editor.isActive('listItem') ? run((c) => c.liftListItem('listItem')) : run((c) => c.outdent()))}>
              <IndentDecrease size={16} />
            </Btn>
            <Btn title="Increase indent (Ctrl+])" onClick={() => (editor.isActive('listItem') ? run((c) => c.sinkListItem('listItem')) : run((c) => c.indent()))}>
              <IndentIncrease size={16} />
            </Btn>

            <select
              className="rsel narrow"
              value={lh}
              onChange={(e) => (e.target.value ? run((c) => c.setLineHeight(e.target.value)) : run((c) => c.unsetLineHeight()))}
              title="Line spacing"
            >
              <option value="">Spacing</option>
              {['1', '1.15', '1.5', '2', '2.5', '3'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </>
        )}

        {/* ----------------------------- INSERT ----------------------------- */}
        {tab === 'insert' && (
          <>
            <TablePicker onPick={(r, c) => run((ch) => ch.insertTable({ rows: r, cols: c, withHeaderRow: true }))} />
            <Btn title="Picture from your computer" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={16} />
            </Btn>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                onImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Btn
              title="Picture from web address"
              onClick={() => {
                const src = window.prompt('Image address (https://…)');
                if (src) run((c) => c.setImage({ src }));
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700 }}>URL</span>
            </Btn>

            {img && (
              <select
                className="rsel narrow"
                value={editor.getAttributes('image').width || ''}
                onChange={(e) => editor.chain().focus().updateAttributes('image', { width: e.target.value || null }).run()}
                title="Picture size"
              >
                <option value="">Original</option>
                {['25%', '50%', '75%', '100%'].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            )}

            <Sep />
            <Btn title="Link" active={editor.isActive('link')} onClick={setLink}>
              <Link2 size={16} />
            </Btn>
            <Btn
              title="Insert movable line"
              onClick={() => run((c) => c.insertDocumentLine())}
            >
              <Minus size={16} />
            </Btn>
            <Btn title="Page break" onClick={() => run((c) => c.setPageBreak())}>
              <SeparatorHorizontal size={16} />
            </Btn>
            <Btn title="Quote" active={editor.isActive('blockquote')} onClick={() => run((c) => c.toggleBlockquote())}>
              <TextQuote size={16} />
            </Btn>
            <Btn title="Code block" active={editor.isActive('codeBlock')} onClick={() => run((c) => c.toggleCodeBlock())}>
              <Code2 size={16} />
            </Btn>
            <Sep />

            <Btn title="Insert today's date" onClick={() => run((c) => c.insertContent(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })))}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>Date</span>
            </Btn>

            <select
              className="rsel narrow"
              value=""
              onChange={(e) => e.target.value && run((c) => c.insertContent(e.target.value))}
              title="Insert symbol"
            >
              <option value="">Symbol</option>
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}

        {/* ------------------------------ TABLE ----------------------------- */}
        {tab === 'table' && (
          <>
            {!inTable && (
              <span className="rhint">
                Click inside a table to use these tools. Insert one from the Insert tab.
              </span>
            )}

            {inTable && (
              <>
                <button className="rtxt" onClick={() => run((c) => c.addRowBefore())}>Row above</button>
                <button className="rtxt" onClick={() => run((c) => c.addRowAfter())}>Row below</button>
                <button className="rtxt" onClick={() => run((c) => c.addColumnBefore())}>Column left</button>
                <button className="rtxt" onClick={() => run((c) => c.addColumnAfter())}>Column right</button>
                <Sep />
                <button className="rtxt" onClick={() => run((c) => c.deleteRow())}>Delete row</button>
                <button className="rtxt" onClick={() => run((c) => c.deleteColumn())}>Delete column</button>
                <Sep />
                <button className="rtxt" onClick={() => run((c) => c.mergeCells())}>Merge cells</button>
                <button className="rtxt" onClick={() => run((c) => c.splitCell())}>Split cell</button>
                <button className="rtxt" onClick={() => run((c) => c.toggleHeaderRow())}>Header row</button>
                <ColorBtn
                  title="Cell shading"
                  icon={<span className="rA" style={{ fontSize: 11 }}>▨</span>}
                  value={toHex(editor.getAttributes('tableCell').background, '#e5e7eb')}
                  onPick={(v) => run((c) => c.setCellShade(v))}
                  onClear={() => run((c) => c.setCellShade(null))}
                />
                <Sep />
                <button className="rtxt danger" onClick={() => run((c) => c.deleteTable())}>Delete table</button>
              </>
            )}
          </>
        )}

        {/* ------------------------------ LAYOUT ---------------------------- */}
        {tab === 'layout' && (
          <>
            <label className="rlab">
              Size
              <select
                className="rsel"
                value={page.size}
                onChange={(e) => setPage({ ...page, size: e.target.value as PageSettings['size'] })}
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </label>
            <label className="rlab">
              Orientation
              <select
                className="rsel"
                value={page.orientation}
                onChange={(e) => setPage({ ...page, orientation: e.target.value as PageSettings['orientation'] })}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <label className="rlab">
              Margins
              <select
                className="rsel"
                value={page.margin}
                onChange={(e) => setPage({ ...page, margin: e.target.value as PageSettings['margin'] })}
              >
                {(Object.keys(MARGINS) as PageSettings['margin'][]).map((m) => (
                  <option key={m} value={m}>
                    {m[0].toUpperCase() + m.slice(1)} ({(MARGINS[m] / 96).toFixed(2)}″)
                  </option>
                ))}
              </select>
            </label>
            <Sep />
            <label className="rlab">
              <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
              Show page boundaries
            </label>
          </>
        )}

        {/* ------------------------------ REVIEW ---------------------------- */}
        {tab === 'review' && (
          <>
            <button className="rtxt" onClick={onFind}>
              <Search size={14} /> Find &amp; Replace (Ctrl+F)
            </button>
            <label className="rlab">
              <input type="checkbox" checked={spell} onChange={(e) => setSpell(e.target.checked)} />
              Spell check
            </label>
          </>
        )}

        {/* ----------------------------- LINE FORMAT ------------------------ */}
        {tab === 'line' && lineActive && (
          <>
            <ColorBtn
              title="Line colour"
              icon={<Minus size={16} />}
              value={toHex(lineAttrs.lineColor, '#0b4745')}
              onPick={(value) => updateLineAttributes({ lineColor: value })}
              onClear={() => updateLineAttributes({ lineColor: '#0b4745' })}
            />

            <label className="rlab">
              Thickness
              <select
                className="rsel narrow"
                value={String(lineAttrs.lineThickness ?? 2)}
                onChange={(event) => updateLineAttributes({ lineThickness: Number(event.target.value) })}
              >
                {[1, 2, 3, 4, 6, 8].map((value) => (
                  <option key={value} value={value}>{value}px</option>
                ))}
              </select>
            </label>

            <label className="rlab">
              Style
              <select
                className="rsel"
                value={lineAttrs.lineStyle || 'solid'}
                onChange={(event) => updateLineAttributes({ lineStyle: event.target.value })}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
            </label>

            <label className="rlab">
              Width
              <select
                className="rsel narrow"
                value={lineAttrs.lineWidth || '100%'}
                onChange={(event) => updateLineAttributes({ lineWidth: event.target.value })}
              >
                <option value="25%">25%</option>
                <option value="50%">50%</option>
                <option value="75%">75%</option>
                <option value="100%">100%</option>
              </select>
            </label>

            <label className="rlab">
              Position X
              <input
                className="rsel narrow"
                type="number"
                min={0}
                value={Number(lineAttrs.linePositionX ?? 12)}
                onChange={(event) =>
                  updateLineAttributes({
                    lineX: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
            </label>

            <label className="rlab">
              Position Y
              <input
                className="rsel narrow"
                type="number"
                min={0}
                value={Number(lineAttrs.linePositionY ?? 0)}
                onChange={(event) =>
                  updateLineAttributes({
                    lineY: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
            </label>

            <button
              type="button"
              className="rtxt danger"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().deleteSelection().run()}
            >
              Delete line
            </button>
          </>
        )}
      </div>
    </div>
  );
}
