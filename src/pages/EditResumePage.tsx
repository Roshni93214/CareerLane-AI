import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KImage, Transformer } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import { jsPDF } from 'jspdf';
import { useLocation } from 'react-router-dom';
import '../styles/EditResume.css';

/* ================================================================
   Self-contained editor model (kept in this TSX so no helper files
   are needed). The canvas/editor interactions below remain intact.
   ================================================================ */

type Align = 'left' | 'center' | 'right';
type BaseEl = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
};

export type TextEl = BaseEl & {
  type: 'text';
  width: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fill: string;
  align: Align;
  lineHeight: number;
};

export type RectEl = BaseEl & {
  type: 'rect';
  width: number;
  height: number;
  fill: string;
  cornerRadius: number;
  stroke: string;
  strokeWidth: number;
  /** Explicit shape type lets manual shapes survive legacy-divider cleanup. */
  shapeKind?: 'line' | 'rectangle' | 'circle';
};

export type ImageEl = BaseEl & {
  type: 'image';
  width: number;
  height: number;
  src: string;
};

export type El = TextEl | RectEl | ImageEl;
export type Doc = { background: string; elements: El[] };

export const A4_W = 794;
export const A4_H = 1123;
export const FONTS = [
  'Arial', 'Poppins', 'Inter', 'Roboto', 'Open Sans', 'Lato',
  'Montserrat', 'Georgia', 'Times New Roman', 'Calibri', 'Helvetica',
];

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeText(
  input: Partial<TextEl> & Pick<TextEl, 'x' | 'y' | 'width' | 'text'>,
): TextEl {
  return {
    id: input.id ?? uid(),
    type: 'text',
    x: input.x,
    y: input.y,
    rotation: input.rotation ?? 0,
    opacity: input.opacity ?? 1,
    width: input.width,
    text: input.text,
    fontSize: input.fontSize ?? 12,
    fontFamily: input.fontFamily ?? 'Arial',
    bold: input.bold ?? false,
    italic: input.italic ?? false,
    underline: input.underline ?? false,
    fill: input.fill ?? '#263238',
    align: input.align ?? 'left',
    lineHeight: input.lineHeight ?? 1.2,
  };
}

export function makeRect(
  input: Partial<RectEl> & Pick<RectEl, 'x' | 'y' | 'width' | 'height'>,
): RectEl {
  return {
    id: input.id ?? uid(),
    type: 'rect',
    x: input.x,
    y: input.y,
    rotation: input.rotation ?? 0,
    opacity: input.opacity ?? 1,
    width: input.width,
    height: input.height,
    fill: input.fill ?? '#0b4745',
    cornerRadius: input.cornerRadius ?? 0,
    stroke: input.stroke ?? '#0b4745',
    strokeWidth: input.strokeWidth ?? 0,
    shapeKind: input.shapeKind,
  };
}

function buildStarterTemplate(accent: string, background: string): Doc {
  return {
    background,
    elements: [
      makeText({ x: 54, y: 52, width: 680, text: 'YOUR NAME', fontSize: 28, bold: true, fontFamily: 'Poppins', fill: accent }),
      makeText({ x: 54, y: 91, width: 680, text: 'Email  |  Phone  |  LinkedIn', fontSize: 10, fill: '#52616b' }),
      makeText({ x: 54, y: 145, width: 686, text: 'PROFESSIONAL SUMMARY', fontSize: 13, bold: true, fill: accent }),
      makeText({ x: 54, y: 170, width: 686, text: 'Add a concise summary of your experience, skills, and career goals here.', fontSize: 11 }),
      makeText({ x: 54, y: 222, width: 686, text: 'TECHNICAL SKILLS', fontSize: 13, bold: true, fill: accent }),
      makeText({ x: 54, y: 247, width: 686, text: 'Add your relevant skills here.', fontSize: 11 }),
      makeText({ x: 54, y: 300, width: 686, text: 'EXPERIENCE', fontSize: 13, bold: true, fill: accent }),
      makeText({ x: 54, y: 325, width: 686, text: 'Role / Organization  |  Dates\nAdd key responsibilities and achievements.', fontSize: 11 }),
      makeText({ x: 54, y: 405, width: 686, text: 'EDUCATION', fontSize: 13, bold: true, fill: accent }),
      makeText({ x: 54, y: 430, width: 686, text: 'Degree / Institution  |  Graduation year', fontSize: 11 }),
      makeText({ x: 54, y: 485, width: 686, text: 'PROJECTS', fontSize: 13, bold: true, fill: accent }),
      makeText({ x: 54, y: 510, width: 686, text: 'Project name — describe your contribution and tools used.', fontSize: 11 }),
    ],
  };
}

const TEMPLATES = [
  { name: 'Professional', build: () => buildStarterTemplate('#0b4745', '#ffffff') },
  { name: 'Modern', build: () => buildStarterTemplate('#3757b5', '#ffffff') },
  { name: 'Minimal', build: () => buildStarterTemplate('#343a40', '#ffffff') },
];

const STORAGE_KEY = 'resume-editor-doc';
const CAREERLANE_TEXT_KEY = 'careerLaneResumeText';
const SOURCE_STORAGE_KEY = 'resume-editor-source-text';

/**
 * Older versions inserted a teal, full-width rectangle under every section.
 * Remove those legacy auto-generated shapes once the old canvas is loaded.
 * Newly-added manual lines carry shapeKind="line" and are never removed here.
 */
function removeLegacyAutoDividerLines(doc: Doc): Doc {
  const elements = doc.elements.filter((element) => {
    if (element.type !== 'rect' || element.shapeKind) return true;

    const isOldImportedSectionRule =
      Math.abs(element.x - 52) < 1 &&
      Math.abs(element.width - (A4_W - 104)) < 2 &&
      element.height >= 1.4 &&
      element.height <= 2.1 &&
      element.fill.toLowerCase() === '#0b4745' &&
      element.strokeWidth === 0 &&
      element.cornerRadius === 0 &&
      Math.abs(element.rotation) < 0.1;

    const isOldStarterTemplateRule =
      Math.abs(element.x - 54) < 1 &&
      Math.abs(element.y - 117) < 1 &&
      Math.abs(element.width - 686) < 1 &&
      Math.abs(element.height - 3) < 0.1 &&
      ['#0b4745', '#3757b5', '#343a40'].includes(element.fill.toLowerCase()) &&
      element.strokeWidth === 0 &&
      Math.abs(element.rotation) < 0.1;

    return !(isOldImportedSectionRule || isOldStarterTemplateRule);
  });

  return elements.length === doc.elements.length ? doc : { ...doc, elements };
}

/** Read the text saved by CareerLane's existing ResumeUploadPage. */
function readCareerLaneResumeText(routeResumeText?: string): string {
  const fromRoute = routeResumeText?.trim();
  if (fromRoute) return fromRoute;
  try {
    // Upload flow explicitly writes this session key, including an empty value.
    // Respect that session value so a failed/new upload cannot show an old resume.
    const sessionValue = window.sessionStorage.getItem(CAREERLANE_TEXT_KEY);
    if (sessionValue !== null) return sessionValue.trim();
    return (window.localStorage.getItem(CAREERLANE_TEXT_KEY) || '').trim();
  } catch {
    return '';
  }
}

const SECTION_NAMES = [
  'professional summary', 'summary', 'profile', 'career objective', 'objective',
  'technical skills', 'skills', 'work experience', 'professional experience',
  'experience', 'internship', 'internships', 'education', 'projects',
  'certifications', 'achievements', 'languages', 'interests', 'references',
  'additional information', 'personal information', 'personal details',
  'core competencies', 'key skills', 'employment history', 'work history',
  'academic background', 'technical proficiencies', 'awards', 'publications',
  'volunteer experience',
];

function cleanHeading(value: string): string {
  return value.trim().replace(/[:：]$/, '').toLowerCase();
}

function isResumeSectionHeading(value: string): boolean {
  const cleaned = value.trim();
  const normalized = cleanHeading(cleaned);

  if (SECTION_NAMES.includes(normalized)) return true;

  // Keep support for unfamiliar ALL-CAPS headings, but don't mistake a
  // candidate's name/contact line or job title for a section heading.
  return (
    /^[A-Z][A-Z0-9 &/(),.-]{2,}$/.test(cleaned) &&
    cleaned.length < 48 &&
    !/[|@]/.test(cleaned) &&
    !/\b(student|intern|developer|engineer|analyst|manager|consultant)\b/i.test(cleaned)
  );
}

const BULLET_PREFIX = /^[\u2022\u25cf\u25aa\u25e6\u2023\u2219\u00b7\uf0b7\u25ab\u25a0\u25a1\-–—]\s*/;
const ACTION_START = /^(developed|developing|created|built|implemented|designed|learned|improved|worked|working|contributed|assisted|managed|led|conducted|performed|utilized|used|collaborated|engineered|analyzed|automated|optimized|maintained|responsible for|experience with|familiar with|handled|integrated|tested|deployed|wrote|configured|prepared|supported|delivered|applied|demonstrated|solved|gained|participated in)\b/i;

function isRoleHeading(value: string): boolean {
  return (
    /\b(intern|developer|engineer|analyst|manager|consultant|specialist|associate|designer|architect|trainee)\b/i.test(value) &&
    (/[–—]|\s-\s|\([^)]*(month|year)/i.test(value) || /\b(pvt\.?\s*ltd|solutions|technologies|company|corp\.?|limited|inc\.?|llc)\b/i.test(value))
  );
}

/**
 * Convert CareerLane's extracted resume text into editable canvas items.
 * Common list bullets are recreated where needed, but section divider lines
 * are intentionally not inserted automatically: the user can add them manually.
 */
function createCareerLaneResumeDoc(rawText: string): Doc {
  let normalized = rawText
    .replace(/\u0000/g, '')
    .replace(/\r/g, '')
    // Mammoth/Word extractors sometimes emit the legacy Word bullet glyph.
    .replace(/[\uf0b7\uf0a7\uf0d8]/g, '•')
    .replace(/[\t ]+/g, ' ')
    .trim();

  if (!normalized) return TEMPLATES[0].build();

  // Some extractors flatten the entire resume into one line. Put section
  // titles and any explicit bullet markers back on separate lines.
  if (!normalized.includes('\n')) {
    const escapedSections = SECTION_NAMES
      .slice()
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    normalized = normalized
      .replace(new RegExp(`\\s+(?=(${escapedSections})\\b)`, 'gi'), '\n')
      .replace(/\s*([•●▪◦‣∙·])\s*/g, '\n$1 ');
  }

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);

  if (!lines.length) return TEMPLATES[0].build();

  const contentWidth = A4_W - 104;
  let activeSection = '';

  const layouts = lines.map((rawLine, index) => {
    const explicitBullet = BULLET_PREFIX.test(rawLine);
    const cleanedText = rawLine.replace(BULLET_PREFIX, '').trim();
    const isName = index === 0 && cleanedText.length <= 72;
    const isHeading = !isName && isResumeSectionHeading(cleanedText);

    if (isHeading) activeSection = cleanHeading(cleanedText);

    const isContact = !isName && !isHeading && cleanedText.length <= 180 &&
      /@|https?:|www\.|linkedin|github|\+?\d[\d ()-]{7,}/i.test(cleanedText);

    const roleHeading = activeSection === 'professional experience' || activeSection === 'work experience' || activeSection === 'experience'
      ? isRoleHeading(cleanedText)
      : false;

    // In plain text extracted from DOCX, Word's bullet numbering is normally
    // absent. Recreate bullets by section where list intent is unambiguous.
    const sectionNeedsBullets =
      activeSection === 'technical skills' ||
      activeSection === 'skills' ||
      activeSection === 'certifications' ||
      activeSection === 'achievements';

    const experienceBullet =
      ['professional experience', 'work experience', 'experience', 'internship', 'internships'].includes(activeSection) &&
      !roleHeading &&
      !isHeading &&
      !isContact;

    const projectBullet =
      activeSection === 'projects' &&
      ACTION_START.test(cleanedText);

    const isBullet = !isHeading && !isName && (
      explicitBullet || sectionNeedsBullets || experienceBullet || projectBullet
    );

    const displayText = isBullet ? `•  ${cleanedText}` : cleanedText;
    const fontSize = isName ? 23 : isHeading ? 12.5 : isContact ? 9 : 10;
    const charsPerLine = Math.max(24, Math.floor(contentWidth / (fontSize * 0.54)));
    const wrappedLines = Math.max(1, Math.ceil(displayText.length / charsPerLine));
    const gapAfter = isHeading ? 8 : isName ? 4 : isContact ? 2 : isBullet ? 2 : 3;

    return {
      text: displayText,
      fontSize,
      bold: isName || isHeading || roleHeading,
      fill: isName || isHeading ? '#0b4745' : isContact ? '#52616b' : '#263238',
      wrappedLines,
      gapAfter,
      isHeading,
      isBullet,
    };
  });

  // No divider lines are auto-created. Keep headings as editable text and let
  // the user add/move/resize lines from the Shapes tools when desired.
  const estimatedHeight = layouts.reduce(
    (sum, item) =>
      sum + item.fontSize * 1.17 * item.wrappedLines + item.gapAfter,
    0,
  );
  const availableHeight = A4_H - 92;
  const scale = Math.min(1, availableHeight / Math.max(1, estimatedHeight));

  let y = 42;
  const elements: El[] = [];

  for (const item of layouts) {
    const fontSize = Math.max(6, item.fontSize * scale);
    const charsPerLine = Math.max(22, Math.floor(contentWidth / (fontSize * 0.54)));
    const wrappedLines = Math.max(1, Math.ceil(item.text.length / charsPerLine));

    elements.push(makeText({
      x: 52,
      y,
      width: contentWidth,
      text: item.text,
      fontSize,
      fontFamily: 'Arial',
      bold: item.bold,
      fill: item.fill,
      align: 'left',
      lineHeight: 1.17,
    }));

    y += fontSize * 1.17 * wrappedLines + 1 + item.gapAfter * scale;
  }

  return { background: '#ffffff', elements };
}

type Props = {

  initialDoc?: Doc;

  onSave?: (doc: Doc) => void;

};

/* ------------------------------------------------------------------ */

/* A single canvas element                                             */

/* ------------------------------------------------------------------ */

type ItemProps = {

  el: El;

  hidden: boolean;

  register: (id: string, node: Konva.Node | null) => void;

  onSelect: (id: string) => void;

  onChange: (id: string, patch: Partial<El>) => void;

  onEditText: (id: string) => void;

};

function CanvasImage({ el, ...common }: { el: ImageEl } & Record<string, unknown>) {

  const [img] = useImage(el.src, 'anonymous');

  return <KImage image={img} width={el.width} height={el.height} {...common} />;

}

function Item({ el, hidden, register, onSelect, onChange, onEditText }: ItemProps) {

  const common = {

    id: el.id,

    x: el.x,

    y: el.y,

    rotation: el.rotation,

    opacity: el.opacity,

    draggable: true,

    ref: (node: Konva.Node | null) => register(el.id, node),

    onMouseDown: () => onSelect(el.id),

    onTouchStart: () => onSelect(el.id),

    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>

      onChange(el.id, { x: e.target.x(), y: e.target.y() }),

    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {

      const node = e.target;

      const sx = node.scaleX();

      const sy = node.scaleY();

      node.scaleX(1);

      node.scaleY(1);

      const base = { x: node.x(), y: node.y(), rotation: node.rotation() };

      if (el.type === 'text') {

        onChange(el.id, { ...base, width: Math.max(30, node.width() * sx) });

      } else {

        onChange(el.id, {

          ...base,

          width: Math.max(4, node.width() * sx),

          height: Math.max(1, node.height() * sy),

        });

      }

    },

  };

  if (el.type === 'text') {

    const style = [el.italic ? 'italic' : '', el.bold ? 'bold' : ''].filter(Boolean).join(' ') || 'normal';

    return (

      <Text

        {...common}

        visible={!hidden}

        width={el.width}

        text={el.text}

        fontSize={el.fontSize}

        fontFamily={el.fontFamily}

        fontStyle={style}

        textDecoration={el.underline ? 'underline' : ''}

        fill={el.fill}

        align={el.align}

        lineHeight={el.lineHeight}

        onDblClick={() => onEditText(el.id)}

        onDblTap={() => onEditText(el.id)}

      />

    );

  }

  if (el.type === 'rect') {

    return (

      <Rect

        {...common}

        width={el.width}

        height={el.height}

        fill={el.fill}

        cornerRadius={el.cornerRadius}

        stroke={el.strokeWidth > 0 ? el.stroke : undefined}

        strokeWidth={el.strokeWidth}

      />

    );

  }

  return <CanvasImage el={el} {...common} />;

}

/* ------------------------------------------------------------------ */

/* Editor                                                              */

/* ------------------------------------------------------------------ */

function loadInitial(initialDoc?: Doc, routeResumeText?: string): Doc {
  if (initialDoc) return initialDoc;

  const resumeText = readCareerLaneResumeText(routeResumeText);
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const savedSource = window.localStorage.getItem(SOURCE_STORAGE_KEY) || '';

    // Reuse the edited canvas only when it belongs to the currently uploaded resume.
    if (saved && resumeText && savedSource === resumeText) {
      const parsed = JSON.parse(saved) as Doc;
      const cleaned = removeLegacyAutoDividerLines(parsed);
      if (cleaned !== parsed) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    }

    // A new resume upload should replace the old editor's canvas content.
    if (resumeText) {
      const imported = createCareerLaneResumeDoc(resumeText);
      window.localStorage.setItem(SOURCE_STORAGE_KEY, resumeText);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      return imported;
    }

    if (saved) {
      const parsed = JSON.parse(saved) as Doc;
      const cleaned = removeLegacyAutoDividerLines(parsed);
      if (cleaned !== parsed) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    }
  } catch {
    // Continue with a visible fallback if browser storage is unavailable.
  }

  return resumeText ? createCareerLaneResumeDoc(resumeText) : TEMPLATES[0].build();
}

export default function EditResumePage({ initialDoc, onSave }: Props) {

  const location = useLocation();
  const routeResumeText = (location.state as { resumeText?: string } | null)?.resumeText;
  const [doc, setDoc] = useState<Doc>(() => loadInitial(initialDoc, routeResumeText));

  const [past, setPast] = useState<Doc[]>([]);

  const [future, setFuture] = useState<Doc[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [zoom, setZoom] = useState(0.8);

  const [toast, setToast] = useState('');

  const stageRef = useRef<Konva.Stage>(null);

  const trRef = useRef<Konva.Transformer>(null);

  const nodes = useRef<Record<string, Konva.Node | null>>({});

  const editBase = useRef<Doc | null>(null);

  const lastKey = useRef<{ key: string; t: number }>({ key: '', t: 0 });

  const fileRef = useRef<HTMLInputElement>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);

  const selected = doc.elements.find((e) => e.id === selectedId) ?? null;

  /* ---------- history ---------- */

  const commit = useCallback(

    (next: Doc, key?: string) => {

      const now = Date.now();

      const coalesce = key && lastKey.current.key === key && now - lastKey.current.t < 800;

      lastKey.current = { key: key ?? '', t: now };

      if (!coalesce) setPast((p) => [...p.slice(-49), doc]);

      setDoc(next);

      setFuture([]);

    },

    [doc],

  );

  const undo = useCallback(() => {

    if (!past.length) return;

    setFuture((f) => [doc, ...f]);

    setDoc(past[past.length - 1]);

    setPast((p) => p.slice(0, -1));

    setSelectedId(null);

  }, [past, doc]);

  const redo = useCallback(() => {

    if (!future.length) return;

    setPast((p) => [...p, doc]);

    setDoc(future[0]);

    setFuture((f) => f.slice(1));

    setSelectedId(null);

  }, [future, doc]);

  /* ---------- element operations ---------- */

  const updateEl = useCallback(

    (id: string, patch: Partial<El>, key?: string) => {

      commit(

        { ...doc, elements: doc.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as El) : e)) },

        key,

      );

    },

    [doc, commit],

  );

  const addEl = (el: El) => {

    commit({ ...doc, elements: [...doc.elements, el] });

    setSelectedId(el.id);

  };

  const removeSelected = useCallback(() => {

    if (!selectedId) return;

    commit({ ...doc, elements: doc.elements.filter((e) => e.id !== selectedId) });

    setSelectedId(null);

  }, [doc, selectedId, commit]);

  const duplicateSelected = useCallback(() => {

    if (!selected) return;

    const copy = { ...selected, id: uid(), x: selected.x + 20, y: selected.y + 20 } as El;

    addEl(copy);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [selected, doc]);

  const reorder = (dir: 'front' | 'back' | 'up' | 'down') => {

    if (!selectedId) return;

    const arr = [...doc.elements];

    const i = arr.findIndex((e) => e.id === selectedId);

    const [item] = arr.splice(i, 1);

    const target =

      dir === 'front' ? arr.length : dir === 'back' ? 0 : dir === 'up' ? Math.min(arr.length, i + 1) : Math.max(0, i - 1);

    arr.splice(target, 0, item);

    commit({ ...doc, elements: arr });

  };

  const centerH = () => {

    const node = selectedId ? nodes.current[selectedId] : null;

    if (!node || !selectedId) return;

    const box = node.getClientRect({ skipTransform: false, relativeTo: node.getLayer() as Konva.Container });

    updateEl(selectedId, { x: (selected?.x ?? 0) + (A4_W / 2 - (box.x + box.width / 2)) });

  };

  const alignSelected = (alignment: 'left' | 'center' | 'right') => {
    if (!selected) return;

    const margin = 52;
    const targetX =
      alignment === 'left'
        ? margin
        : alignment === 'center'
          ? (A4_W - selected.width) / 2
          : A4_W - margin - selected.width;

    updateEl(selected.id, { x: Math.max(0, targetX) }, `align-${alignment}`);
  };

  /* ---------- adding things ---------- */

  const addText = (kind: 'heading' | 'subheading' | 'body') => {

    const preset = {

      heading: { text: 'Heading', fontSize: 28, bold: true, fontFamily: 'Poppins' },

      subheading: { text: 'Subheading', fontSize: 16, bold: true },

      body: { text: 'Double-click to edit this text', fontSize: 12 },

    }[kind];

    addEl(makeText({ x: 80, y: 80, width: 320, ...preset }));

  };

  const addShape = (kind: 'rect' | 'circle' | 'line') => {
    const baseX = selected ? Math.min(A4_W - 220, selected.x + 18) : 52;
    const baseY = selected ? Math.min(A4_H - 100, selected.y + 42) : 180;

    if (kind === 'rect') {
      addEl(makeRect({
        x: baseX,
        y: baseY,
        width: 180,
        height: 90,
        fill: '#e7f2ef',
        stroke: '#0b4745',
        strokeWidth: 1.5,
        shapeKind: 'rectangle',
      }));
    }

    if (kind === 'circle') {
      addEl(makeRect({
        x: baseX,
        y: baseY,
        width: 110,
        height: 110,
        fill: '#f5ead7',
        stroke: '#c5a06a',
        strokeWidth: 1.5,
        cornerRadius: 9999,
        shapeKind: 'circle',
      }));
    }

    if (kind === 'line') {
      addEl(makeRect({
        x: 52,
        y: selected ? Math.min(A4_H - 20, selected.y + 35) : baseY,
        width: A4_W - 104,
        height: 2.5,
        fill: '#0b4745',
        stroke: '#0b4745',
        strokeWidth: 0,
        cornerRadius: 0,
        shapeKind: 'line',
      }));
    }
  };

  const onImageFile = (file?: File) => {

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      const src = String(reader.result);

      const img = new window.Image();

      img.onload = () => {

        const w = Math.min(220, img.naturalWidth);

        const h = (img.naturalHeight / img.naturalWidth) * w;

        addEl({ id: uid(), type: 'image', x: 100, y: 100, rotation: 0, opacity: 1, width: w, height: h, src });

      };

      img.src = src;

    };

    reader.readAsDataURL(file);

  };

  const loadTemplate = (i: number) => {

    if (doc.elements.length && !window.confirm('Replace the current design with this template?')) return;

    commit(TEMPLATES[i].build());

    setSelectedId(null);

  };

  /* ---------- text editing overlay ---------- */

  const startEdit = (id: string) => {

    editBase.current = doc;

    setSelectedId(id);

    setEditingId(id);

  };

  const finishEdit = useCallback(() => {

    if (editBase.current && JSON.stringify(editBase.current) !== JSON.stringify(doc)) {

      const base = editBase.current;

      setPast((p) => [...p.slice(-49), base]);

      setFuture([]);

    }

    editBase.current = null;

    setEditingId(null);

  }, [doc]);

  const editingEl = doc.elements.find((e) => e.id === editingId && e.type === 'text') as TextEl | undefined;

  useEffect(() => {

    const ta = taRef.current;

    if (ta) {

      ta.style.height = 'auto';

      ta.style.height = ta.scrollHeight + 'px';

    }

  }, [editingEl?.text, editingId]);

  /* ---------- transformer ---------- */

  useEffect(() => {

    const tr = trRef.current;

    if (!tr) return;

    const node = selectedId && !editingId ? nodes.current[selectedId] : null;

    tr.nodes(node ? [node] : []);

    tr.getLayer()?.batchDraw();

  }, [selectedId, editingId, doc]);

  /* ---------- fonts: redraw once web fonts are ready ---------- */

  useEffect(() => {

    const loads = FONTS.flatMap((f) => [`400 16px "${f}"`, `700 16px "${f}"`].map((s) => document.fonts.load(s)));

    Promise.all(loads).then(() => stageRef.current?.batchDraw());

  }, []);

  /* ---------- autosave locally ---------- */

  useEffect(() => {

    const t = setTimeout(() => {

      try {

        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));

      } catch {

        /* storage full (large images) — ignore */

      }

    }, 500);

    return () => clearTimeout(t);

  }, [doc]);

  /* ---------- keyboard shortcuts ---------- */

  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      const tag = (e.target as HTMLElement).tagName;

      if (editingId || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {

        e.preventDefault();

        e.shiftKey ? redo() : undo();

      } else if (mod && e.key.toLowerCase() === 'y') {

        e.preventDefault();

        redo();

      } else if (mod && e.key.toLowerCase() === 'd') {

        e.preventDefault();

        duplicateSelected();

      } else if ((e.key === 'Enter' || e.key === 'F2') && selected?.type === 'text') {

        // Edit the selected text element without requiring a double-click.
        e.preventDefault();
        startEdit(selected.id);

      } else if (e.key === 'Delete' || e.key === 'Backspace') {

        // Outside text-edit mode, Backspace/Delete remove the selected object.
        removeSelected();

      } else if (selected && e.key.startsWith('Arrow')) {

        e.preventDefault();

        const step = e.shiftKey ? 10 : 1;

        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;

        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        updateEl(selected.id, { x: selected.x + dx, y: selected.y + dy }, 'nudge');

      } else if (e.key === 'Escape') {

        setSelectedId(null);

      }

    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);

  }, [editingId, undo, redo, duplicateSelected, removeSelected, selected, updateEl, startEdit]);

  /* ---------- save / export ---------- */

  const flash = (msg: string) => {

    setToast(msg);

    setTimeout(() => setToast(''), 1800);

  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));

      // Keep CareerLane's existing resume-text key synchronized after Save.
      const editedText = doc.elements
        .filter((el): el is TextEl => el.type === 'text')
        .slice()
        .sort((a, b) => (a.y - b.y) || (a.x - b.x))
        .map((el) => el.text.trim())
        .filter(Boolean)
        .join('\n');

      if (editedText) {
        window.sessionStorage.setItem(CAREERLANE_TEXT_KEY, editedText);
        window.localStorage.setItem(CAREERLANE_TEXT_KEY, editedText);
        window.localStorage.setItem(SOURCE_STORAGE_KEY, editedText);
      }
    } catch {
      /* ignore unavailable/full browser storage */
    }
    onSave?.(doc);
    flash('Saved');
  };

  const snapshot = (pixelRatio: number) => {

    const stage = stageRef.current!;

    const tr = trRef.current!;

    tr.hide();

    const url = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });

    tr.show();

    return url;

  };

  const download = (href: string, name: string) => {

    const a = document.createElement('a');

    a.href = href;

    a.download = name;

    a.click();

  };

  const exportPNG = () => download(snapshot(2), 'resume.png');

  const exportPDF = () => {

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    pdf.addImage(snapshot(2), 'PNG', 0, 0, 210, 297);

    pdf.save('resume.pdf');

  };

  const exportJSON = () =>

    download('data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc)), 'resume.json');

  const importJSON = (file?: File) => {

    if (!file) return;

    file.text().then((t) => {

      try {

        const parsed = JSON.parse(t) as Doc;

        if (!Array.isArray(parsed.elements)) throw new Error();

        commit(parsed);

        setSelectedId(null);

      } catch {

        flash('Invalid file');

      }

    });

  };

  /* ---------- property helpers ---------- */

  const patch = (p: Partial<El>, key: string) => selected && updateEl(selected.id, p, key);

  const t = selected?.type === 'text' ? (selected as TextEl) : null;

  const r = selected?.type === 'rect' ? (selected as RectEl) : null;

  return (

    <div className="re-root">

      {/* ---------------- top bar ---------------- */}

      <header className="re-top">

        <strong className="re-brand">Resume Editor</strong>

        <div className="re-group">

          <button onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)">↶ Undo</button>

          <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)">↷ Redo</button>

        </div>

        <div className="re-group">

          <button onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}>−</button>

          <span className="re-zoom">{Math.round(zoom * 100)}%</span>

          <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>+</button>

        </div>

        <span className="re-spacer" />

        <div className="re-group">

          <button onClick={save}>Save</button>

          <button onClick={exportPNG}>PNG</button>

          <button className="re-primary" onClick={exportPDF}>Download PDF</button>

        </div>

      </header>

      <div className="re-body">

        {/* ---------------- left panel ---------------- */}

        <aside className="re-side">

          <h4>Templates</h4>

          <div className="re-grid">

            {TEMPLATES.map((tpl, i) => (

              <button key={tpl.name} onClick={() => loadTemplate(i)}>{tpl.name}</button>

            ))}

          </div>

          <h4>Text</h4>

          <button className="re-wide re-h1" onClick={() => addText('heading')}>Add a heading</button>

          <button className="re-wide re-h2" onClick={() => addText('subheading')}>Add a subheading</button>

          <button className="re-wide" onClick={() => addText('body')}>Add body text</button>

          <h4>Add Line &amp; Shapes</h4>

          <div className="re-grid">
            <button title="Add a full-width editable line" onClick={() => addShape('line')}>＋ Add Line</button>
            <button title="Add a rectangle you can move and resize" onClick={() => addShape('rect')}>▭ Rectangle</button>
            <button title="Add a circle you can move and resize" onClick={() => addShape('circle')}>● Circle</button>
          </div>

          <p className="re-hint">Select a line or shape to change its position, size, color and alignment in the right panel.</p>

          <h4>Uploads</h4>

          <button className="re-wide" onClick={() => fileRef.current?.click()}>＋ Upload photo / logo</button>

          <input

            ref={fileRef}

            type="file"

            accept="image/*"

            hidden

            onChange={(e) => {

              onImageFile(e.target.files?.[0]);

              e.target.value = '';

            }}

          />

          <h4>Project file</h4>

          <div className="re-grid">

            <button onClick={exportJSON}>Export JSON</button>

            <label className="re-btn">

              Import JSON

              <input type="file" accept="application/json" hidden onChange={(e) => importJSON(e.target.files?.[0])} />

            </label>

          </div>

          <p className="re-hint">

            Double-click text to edit, or select text and press Enter/F2. Drag to move · Corners resize/rotate · Delete removes · Ctrl+D duplicates

          </p>

        </aside>

        {/* ---------------- canvas ---------------- */}

        <main className="re-canvas-area" onMouseDown={(e) => e.target === e.currentTarget && setSelectedId(null)}>

          <div style={{ width: A4_W * zoom, height: A4_H * zoom, margin: '24px auto' }}>

            <div

              className="re-page"

              style={{ width: A4_W, height: A4_H, transform: `scale(${zoom})`, transformOrigin: '0 0' }}

            >

              <Stage

                ref={stageRef}

                width={A4_W}

                height={A4_H}

                onMouseDown={(e) => {

                  if (e.target === e.target.getStage() || e.target.name() === 'page') setSelectedId(null);

                }}

                onTouchStart={(e) => {

                  if (e.target === e.target.getStage() || e.target.name() === 'page') setSelectedId(null);

                }}

              >

                <Layer>

                  <Rect name="page" x={0} y={0} width={A4_W} height={A4_H} fill={doc.background} />

                  {doc.elements.map((el) => (

                    <Item

                      key={el.id}

                      el={el}

                      hidden={el.id === editingId}

                      register={(id, node) => {

                        nodes.current[id] = node;

                      }}

                      onSelect={setSelectedId}

                      onChange={(id, p) => updateEl(id, p)}

                      onEditText={startEdit}

                    />

                  ))}

                  <Transformer

                    ref={trRef}

                    rotateEnabled

                    keepRatio={selected?.type === 'image'}

                    enabledAnchors={

                      selected?.type === 'text'

                        ? ['middle-left', 'middle-right']

                        : ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']

                    }

                    borderStroke="#6366f1"

                    anchorStroke="#6366f1"

                    anchorFill="#ffffff"

                    anchorSize={9}

                    rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}

                  />

                </Layer>

              </Stage>

              {editingEl && (

                <textarea

                  ref={taRef}

                  autoFocus

                  className="re-edit"

                  value={editingEl.text}

                  onChange={(e) =>

                    setDoc((d) => ({

                      ...d,

                      elements: d.elements.map((x) => (x.id === editingEl.id ? ({ ...x, text: e.target.value } as El) : x)),

                    }))

                  }

                  onBlur={finishEdit}

                  onKeyDown={(e) => e.key === 'Escape' && finishEdit()}

                  style={{

                    position: 'absolute',
                    zIndex: 20,
                    display: 'block',
                    boxSizing: 'border-box',
                    padding: '0 1px',
                    border: '1px dashed #c5a06a',
                    borderRadius: 2,
                    outline: 'none',
                    background: 'rgba(255,255,255,0.97)',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    resize: 'none',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    pointerEvents: 'auto',
                    left: editingEl.x,

                    top: editingEl.y,

                    width: editingEl.width,

                    fontSize: editingEl.fontSize,

                    fontFamily: `"${editingEl.fontFamily}"`,

                    fontWeight: editingEl.bold ? 700 : 400,

                    fontStyle: editingEl.italic ? 'italic' : 'normal',

                    textDecoration: editingEl.underline ? 'underline' : 'none',

                    textAlign: editingEl.align,

                    lineHeight: editingEl.lineHeight,

                    color: editingEl.fill,

                    transform: `rotate(${editingEl.rotation}deg)`,

                  }}

                />

              )}

            </div>

          </div>

        </main>

        {/* ---------------- right panel ---------------- */}

        <aside className="re-side re-props">

          {!selected && (

            <>

              <h4>Page</h4>

              <label className="re-row">

                Background

                <input type="color" value={doc.background} onChange={(e) => commit({ ...doc, background: e.target.value }, 'bg')} />

              </label>

              <p className="re-hint">Select an element to edit its properties.</p>

            </>

          )}

          {selected && (

            <>

              <h4>{selected.type === 'text' ? 'Text' : selected.type === 'image' ? 'Image' : selected.shapeKind === 'line' ? 'Line' : selected.shapeKind === 'circle' ? 'Circle' : 'Shape'}</h4>

              {t && (

                <>

                  <button
                    className="re-wide re-h1"
                    onClick={() => startEdit(selected.id)}
                    title="Edit the text inside this selected text box"
                  >
                    Edit Text ✎
                  </button>

                  <p className="re-hint" style={{ marginTop: 5 }}>
                    Double-click the text on the page, or select it and press Enter/F2.
                  </p>

                  <label className="re-row">

                    Font

                    <select value={t.fontFamily} onChange={(e) => patch({ fontFamily: e.target.value }, 'font')}>

                      {FONTS.map((f) => (

                        <option key={f} value={f}>{f}</option>

                      ))}

                    </select>

                  </label>

                  <label className="re-row">

                    Size

                    <input

                      type="number"

                      min={6}

                      max={200}

                      step={0.5}

                      value={t.fontSize}

                      onChange={(e) => patch({ fontSize: Math.max(6, +e.target.value || 6) }, 'size')}

                    />

                  </label>

                  <label className="re-row">

                    Color

                    <input type="color" value={t.fill} onChange={(e) => patch({ fill: e.target.value }, 'fill')} />

                  </label>

                  <div className="re-grid">

                    <button className={t.bold ? 'on' : ''} onClick={() => patch({ bold: !t.bold }, 'bold')}><b>B</b></button>

                    <button className={t.italic ? 'on' : ''} onClick={() => patch({ italic: !t.italic }, 'italic')}><i>I</i></button>

                    <button className={t.underline ? 'on' : ''} onClick={() => patch({ underline: !t.underline }, 'ul')}><u>U</u></button>

                  </div>

                  <div className="re-grid">

                    {(['left', 'center', 'right'] as const).map((a) => (

                      <button key={a} className={t.align === a ? 'on' : ''} onClick={() => patch({ align: a }, 'align')}>

                        {a === 'left' ? '⯇ Left' : a === 'center' ? '≡ Center' : 'Right ⯈'}

                      </button>

                    ))}

                  </div>

                  <label className="re-row">

                    Line height

                    <input type="range" min={1} max={2.5} step={0.05} value={t.lineHeight} onChange={(e) => patch({ lineHeight: +e.target.value }, 'lh')} />

                  </label>

                </>

              )}

              {r && (
                <>
                  {r.shapeKind === 'line' ? (
                    <>
                      <label className="re-row">
                        Line color
                        <input
                          type="color"
                          value={r.fill}
                          onChange={(e) => patch({ fill: e.target.value, stroke: e.target.value }, 'line-color')}
                        />
                      </label>
                      <label className="re-row">
                        Thickness
                        <input
                          type="range"
                          min={1}
                          max={12}
                          step={0.5}
                          value={Math.min(12, Math.max(1, r.height))}
                          onChange={(e) => patch({ height: +e.target.value }, 'line-thickness')}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="re-row">
                        Fill
                        <input type="color" value={r.fill} onChange={(e) => patch({ fill: e.target.value }, 'fill')} />
                      </label>
                      <label className="re-row">
                        Corner radius
                        <input type="range" min={0} max={200} value={Math.min(r.cornerRadius, 200)} onChange={(e) => patch({ cornerRadius: +e.target.value }, 'cr')} />
                      </label>
                      <label className="re-row">
                        Border color
                        <input type="color" value={r.stroke} onChange={(e) => patch({ stroke: e.target.value }, 'stroke')} />
                      </label>
                      <label className="re-row">
                        Border width
                        <input type="range" min={0} max={20} value={r.strokeWidth} onChange={(e) => patch({ strokeWidth: +e.target.value }, 'sw')} />
                      </label>
                    </>
                  )}
                </>
              )}

              <h4>Position &amp; Size</h4>

              <label className="re-row">
                X position
                <input
                  type="number"
                  min={0}
                  max={A4_W}
                  step={1}
                  value={Math.round(selected.x)}
                  onChange={(e) => patch({ x: Number(e.target.value) || 0 }, 'pos-x')}
                />
              </label>

              <label className="re-row">
                Y position
                <input
                  type="number"
                  min={0}
                  max={A4_H}
                  step={1}
                  value={Math.round(selected.y)}
                  onChange={(e) => patch({ y: Number(e.target.value) || 0 }, 'pos-y')}
                />
              </label>

              <label className="re-row">
                Width
                <input
                  type="number"
                  min={4}
                  max={A4_W}
                  step={1}
                  value={Math.round(selected.width)}
                  onChange={(e) => patch({ width: Math.max(4, Math.min(A4_W, Number(e.target.value) || 4)) }, 'size-w')}
                />
              </label>

              {selected.type !== 'text' && (
                <label className="re-row">
                  Height
                  <input
                    type="number"
                    min={1}
                    max={A4_H}
                    step={1}
                    value={Math.round(selected.height)}
                    onChange={(e) => patch({ height: Math.max(1, Math.min(A4_H, Number(e.target.value) || 1)) }, 'size-h')}
                  />
                </label>
              )}

              <h4>Align on page</h4>
              <div className="re-grid">
                <button onClick={() => alignSelected('left')}>Align Left</button>
                <button onClick={() => alignSelected('center')}>Center</button>
                <button onClick={() => alignSelected('right')}>Align Right</button>
              </div>

              <label className="re-row">

                Opacity

                <input type="range" min={0.05} max={1} step={0.05} value={selected.opacity} onChange={(e) => patch({ opacity: +e.target.value }, 'op')} />

              </label>

              <label className="re-row">

                Rotation

                <input type="number" value={Math.round(selected.rotation)} onChange={(e) => patch({ rotation: +e.target.value || 0 }, 'rot')} />

              </label>

              <h4>Arrange</h4>

              <div className="re-grid">

                <button onClick={() => reorder('front')}>To front</button>

                <button onClick={() => reorder('back')}>To back</button>

                <button onClick={() => reorder('up')}>Forward</button>

                <button onClick={() => reorder('down')}>Backward</button>

                <button onClick={centerH}>Center on page</button>

                <button onClick={duplicateSelected}>Duplicate</button>

              </div>

              <button className="re-wide re-danger" onClick={removeSelected}>Delete</button>

            </>

          )}

        </aside>

      </div>

      {toast && <div className="re-toast">{toast}</div>}

    </div>

  );

}
