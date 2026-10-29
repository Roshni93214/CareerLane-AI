import type { SavedDoc } from './types';

const KEY = 'docs-editor:documents';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function listDocs(): SavedDoc[] {
  try {
    const raw = localStorage.getItem(KEY);
    const docs = raw ? (JSON.parse(raw) as SavedDoc[]) : [];
    return docs.sort((a, b) => b.updated - a.updated);
  } catch {
    return [];
  }
}

/** Returns false when the browser storage is full (large embedded images). */
export function saveDoc(doc: SavedDoc): boolean {
  try {
    const docs = listDocs().filter((d) => d.id !== doc.id);
    docs.push(doc);
    localStorage.setItem(KEY, JSON.stringify(docs));
    return true;
  } catch {
    return false;
  }
}

export function removeDoc(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(listDocs().filter((d) => d.id !== id)));
  } catch {
    /* ignore */
  }
}
