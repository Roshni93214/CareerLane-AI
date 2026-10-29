import { useEffect, useMemo, useRef, useState } from 'react';
import { FilePlus2, Search, Trash2 } from 'lucide-react';
import { CATEGORIES, LAYOUTS, TEMPLATES, THEMES, buildTemplateHtml, type Template } from '../templates/generate';
import { removeDoc } from '../store';
import { PAGE_SIZES, type SavedDoc } from '../types';

const PAGE_STEP = 48;
const THUMB_SCALE = 0.27;
const PAPER_W = PAGE_SIZES.A4.w;
const PAPER_H = PAGE_SIZES.A4.h;
const THUMB_PAD = 72; // default "moderate" page margin

/** The template preview is only built once the card scrolls into view. */
function Preview({ template }: { template: Template }) {
  const html = useMemo(() => buildTemplateHtml(template), [template]);
  return (
    <div
      className="thumb-inner doc-content"
      style={{ transform: `scale(${THUMB_SCALE})`, padding: THUMB_PAD }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function Thumb({ template }: { template: Template }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="thumb" style={{ width: PAPER_W * THUMB_SCALE, height: PAPER_H * THUMB_SCALE }}>
      {visible && <Preview template={template} />}
    </div>
  );
}

type Props = {
  recent: SavedDoc[];
  onOpenTemplate: (t: Template | null) => void;
  onOpenDoc: (d: SavedDoc) => void;
  onRecentChanged: () => void;
};

export default function Gallery({ recent, onOpenTemplate, onOpenDoc, onRecentChanged }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('resume');
  const [theme, setTheme] = useState('all');
  const [layout, setLayout] = useState('all');
  const [shown, setShown] = useState(PAGE_STEP);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter(
      (t) =>
        (category === 'all' || t.categoryId === category) &&
        (theme === 'all' || t.themeId === theme) &&
        (layout === 'all' || t.layoutId === layout) &&
        (!q || q.split(/\s+/).every((w) => t.search.includes(w))),
    );
  }, [query, category, theme, layout]);

  useEffect(() => setShown(PAGE_STEP), [query, category, theme, layout]);

  return (
    <div className="gallery">
      <header className="ghero">
        <div>
          <h1>Start a new document</h1>
          <p>{TEMPLATES.length} ready-made templates across {CATEGORIES.length} document types. Pick one and edit everything.</p>
        </div>
        <label className="gsearch">
          <Search size={16} />
          <input placeholder="Search templates (e.g. invoice, resume, certificate)…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </header>

      {recent.length > 0 && (
        <section className="grecent">
          <h3>Your documents</h3>
          <div className="grecent-row">
            {recent.slice(0, 12).map((d) => (
              <div key={d.id} className="rcard" onClick={() => onOpenDoc(d)}>
                <strong>{d.title}</strong>
                <span>{new Date(d.updated).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <button
                  title="Delete document"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete “${d.title}”?`)) {
                      removeDoc(d.id);
                      onRecentChanged();
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="gfilters">
        <div className="chips">
          <button className={category === 'all' ? 'on' : ''} onClick={() => setCategory('all')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={category === c.id ? 'on' : ''} onClick={() => setCategory(c.id)}>{c.name}</button>
          ))}
        </div>
        <div className="gselects">
          <select value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Colour theme">
            <option value="all">All colours</option>
            {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={layout} onChange={(e) => setLayout(e.target.value)} aria-label="Layout">
            <option value="all">All layouts</option>
            {LAYOUTS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <span className="gcount">{filtered.length} templates</span>
        </div>
      </div>

      <div className="ggrid">
        <button className="gcard blank" onClick={() => onOpenTemplate(null)}>
          <div className="thumb blankthumb" style={{ width: PAPER_W * THUMB_SCALE, height: PAPER_H * THUMB_SCALE }}>
            <FilePlus2 size={36} />
          </div>
          <span className="gname">Blank document</span>
        </button>

        {filtered.slice(0, shown).map((t) => (
          <button key={t.id} className="gcard" onClick={() => onOpenTemplate(t)}>
            <Thumb template={t} />
            <span className="gname">{t.name}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="gempty">No templates match your search.</p>}

      {shown < filtered.length && (
        <div className="gmore">
          <button onClick={() => setShown((s) => s + PAGE_STEP)}>Show more ({filtered.length - shown} left)</button>
        </div>
      )}
    </div>
  );
}
