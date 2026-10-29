import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { ArrowLeft, ChevronDown, FileDown, FolderOpen, Printer, Save } from 'lucide-react';
import { buildExtensions } from './extensions';
import Ribbon from './Ribbon';
import FindReplace from './FindReplace';
import { exportDoc, exportDocx, exportHtml, exportText, importDocx } from './exporters';
import { saveDoc } from '../store';
import { MARGINS, pageDims, type SavedDoc } from '../types';

type Props = { doc: SavedDoc; onBack: () => void };

export default function DocEditor({ doc, onBack }: Props) {
  const [title, setTitle] = useState(doc.title);
  const [page, setPage] = useState(doc.page);
  const [guides, setGuides] = useState(true);
  const [spell, setSpell] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [findOpen, setFindOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [status, setStatus] = useState<'saved' | 'saving' | 'full'>('saved');
  const [pages, setPages] = useState(1);
  const [busy, setBusy] = useState('');

  const surfaceRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number>();
  const latest = useRef({ title, page });
  latest.current = { title, page };

  const editor = useEditor({
    extensions: buildExtensions(),
    content: doc.html,
    editorProps: { attributes: { class: 'doc-content', spellcheck: 'true' } },
  });

  /* ---------- saving ---------- */
  const persist = useCallback(() => {
    if (!editor) return;
    const ok = saveDoc({
      id: doc.id,
      title: latest.current.title.trim() || 'Untitled document',
      html: editor.getHTML(),
      updated: Date.now(),
      page: latest.current.page,
    });
    setStatus(ok ? 'saved' : 'full');
  }, [editor, doc.id]);

  const schedule = useCallback(() => {
    setStatus('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(persist, 600);
  }, [persist]);

  useEffect(() => {
    if (!editor) return;
    editor.on('update', schedule);
    return () => {
      editor.off('update', schedule);
    };
  }, [editor, schedule]);

  useEffect(() => {
    schedule();
  }, [title, page, schedule]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: { class: 'doc-content', spellcheck: String(spell) } } });
  }, [editor, spell]);

  /* ---------- keyboard: Ctrl+S, Ctrl+F ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        window.clearTimeout(timer.current);
        persist();
      } else if (k === 'f') {
        e.preventDefault();
        setFindOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [persist]);

  /* ---------- page count ---------- */
  const { w, h } = pageDims(page);
  const m = MARGINS[page.margin];
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const calc = () => setPages(Math.max(1, Math.ceil((el.scrollHeight - 2 * m) / (h - 2 * m))));
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [h, m, editor]);

  /* ---------- file actions ---------- */
  const guard = async (label: string, fn: () => Promise<void> | void) => {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      window.alert(`Could not ${label.toLowerCase()}.`);
    } finally {
      setBusy('');
      setMenu(false);
    }
  };

  const openDocx = (file?: File) => {
    if (!file || !editor) return;
    guard('Open file', async () => {
      const html = await importDocx(file);
      editor.commands.setContent(html);
      setTitle(file.name.replace(/\.docx?$/i, ''));
    });
  };

  const back = () => {
    window.clearTimeout(timer.current);
    persist();
    onBack();
  };

  if (!editor) return null;

  const words = editor.storage.characterCount.words() as number;
  const chars = editor.storage.characterCount.characters() as number;

  return (
    <div className="editor-root">
      <style>{`@page{size:${page.size} ${page.orientation};margin:${m}px}`}</style>

      {/* ---------------- title bar ---------------- */}
      <header className="topbar">
        <button className="tb" onClick={back} title="Back to templates"><ArrowLeft size={16} /> Templates</button>
        <input className="titleinput" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Document title" />
        <span className={'savestate ' + status}>
          {status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving…' : 'Storage full – export your file'}
        </span>
        <span className="grow" />
        <button className="tb" onClick={() => openRef.current?.click()} title="Open a Word (.docx) file"><FolderOpen size={16} /> Open .docx</button>
        <input ref={openRef} type="file" hidden accept=".docx" onChange={(e) => { openDocx(e.target.files?.[0]); e.target.value = ''; }} />
        <button className="tb" onClick={() => { window.clearTimeout(timer.current); persist(); }} title="Save (Ctrl+S)"><Save size={16} /> Save</button>
        <button className="tb" onClick={() => window.print()} title="Print or save as PDF"><Printer size={16} /> Print / PDF</button>
        <span className="rpop">
          <button className="tb primary" onClick={() => setMenu((o) => !o)}><FileDown size={16} /> {busy || 'Download'} <ChevronDown size={14} /></button>
          {menu && (
            <>
              <div className="rbackdrop" onClick={() => setMenu(false)} />
              <div className="rmenu list">
                <button onClick={() => guard('Export Word', () => exportDocx(editor, title, page))}>Word document (.docx)</button>
                <button onClick={() => guard('Export Word', () => exportDoc(editor, title, page))}>Word 97–2003 (.doc)</button>
                <button onClick={() => guard('Export HTML', () => exportHtml(editor, title, page))}>Web page (.html)</button>
                <button onClick={() => guard('Export text', () => exportText(editor, title))}>Plain text (.txt)</button>
                <button onClick={() => { setMenu(false); window.print(); }}>PDF (via Print)</button>
              </div>
            </>
          )}
        </span>
      </header>

      <Ribbon
        editor={editor}
        page={page}
        setPage={setPage}
        guides={guides}
        setGuides={setGuides}
        spell={spell}
        setSpell={setSpell}
        onFind={() => setFindOpen(true)}
      />

      {/* ---------------- document area ---------------- */}
      <main className="canvas">
        {findOpen && <FindReplace editor={editor} onClose={() => setFindOpen(false)} />}
        <div className="zoomwrap" style={{ zoom }}>
          <div
            ref={surfaceRef}
            className={'page-surface' + (guides ? ' guides' : '')}
            style={{ ['--pw' as string]: `${w}px`, ['--ph' as string]: `${h}px`, ['--pm' as string]: `${m}px` }}
            onClick={(e) => e.target === e.currentTarget && editor.commands.focus('end')}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      {/* ---------------- status bar ---------------- */}
      <footer className="statusbar">
        <span>Page count: {pages}</span>
        <span>{words} words</span>
        <span>{chars} characters</span>
        <span className="grow" />
        <span>{page.size} · {page.orientation}</span>
        <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(1)))}>−</button>
        <input type="range" min={0.4} max={2} step={0.1} value={zoom} onChange={(e) => setZoom(+e.target.value)} aria-label="Zoom" />
        <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}>+</button>
        <span className="zoomlabel">{Math.round(zoom * 100)}%</span>
      </footer>
    </div>
  );
}
