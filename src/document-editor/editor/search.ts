import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';

export const searchKey = new PluginKey('searchReplace');

export type Match = { from: number; to: number };

/** Finds matches inside single text nodes (a match split across differently formatted runs is skipped). */
export function findMatches(doc: PMNode, term: string, caseSensitive: boolean): Match[] {
  const out: Match[] = [];
  if (!term) return out;
  const needle = caseSensitive ? term : term.toLowerCase();
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const hay = caseSensitive ? node.text : node.text.toLowerCase();
    let i = 0;
    while ((i = hay.indexOf(needle, i)) !== -1) {
      out.push({ from: pos + i, to: pos + i + term.length });
      i += term.length;
    }
  });
  return out;
}

type Storage = { term: string; cs: boolean; index: number };

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearch: (term: string, caseSensitive?: boolean) => ReturnType;
      findNext: () => ReturnType;
      findPrev: () => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      replaceAll: (replacement: string) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export const SearchReplace = Extension.create<Record<string, never>, Storage>({
  name: 'searchReplace',

  addStorage() {
    return { term: '', cs: false, index: -1 };
  },

  addCommands() {
    const storage = this.storage;
    const select = (tr: any, m: Match) => {
      tr.setSelection(TextSelection.create(tr.doc, m.from, m.to)).scrollIntoView();
    };
    return {
      setSearch:
        (term, caseSensitive = false) =>
        ({ tr, dispatch }) => {
          storage.term = term;
          storage.cs = caseSensitive;
          storage.index = -1;
          if (dispatch) tr.setMeta(searchKey, true);
          return true;
        },
      findNext:
        () =>
        ({ state, tr, dispatch }) => {
          const ms = findMatches(state.doc, storage.term, storage.cs);
          if (!ms.length) return false;
          storage.index = (storage.index + 1) % ms.length;
          if (dispatch) {
            select(tr, ms[storage.index]);
            tr.setMeta(searchKey, true);
          }
          return true;
        },
      findPrev:
        () =>
        ({ state, tr, dispatch }) => {
          const ms = findMatches(state.doc, storage.term, storage.cs);
          if (!ms.length) return false;
          storage.index = storage.index <= 0 ? ms.length - 1 : storage.index - 1;
          if (dispatch) {
            select(tr, ms[storage.index]);
            tr.setMeta(searchKey, true);
          }
          return true;
        },
      replaceCurrent:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const ms = findMatches(state.doc, storage.term, storage.cs);
          const m = ms[storage.index];
          if (!m) return false;
          if (dispatch) {
            tr.insertText(replacement, m.from, m.to);
            storage.index -= 1; // so "Next" lands on the following match
            tr.setMeta(searchKey, true);
          }
          return true;
        },
      replaceAll:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const ms = findMatches(state.doc, storage.term, storage.cs);
          if (!ms.length) return false;
          if (dispatch) {
            for (let i = ms.length - 1; i >= 0; i--) tr.insertText(replacement, ms[i].from, ms[i].to);
            storage.index = -1;
            tr.setMeta(searchKey, true);
          }
          return true;
        },
      clearSearch:
        () =>
        ({ tr, dispatch }) => {
          storage.term = '';
          storage.index = -1;
          if (dispatch) tr.setMeta(searchKey, true);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    return [
      new Plugin({
        key: searchKey,
        props: {
          decorations(state) {
            if (!storage.term) return DecorationSet.empty;
            const ms = findMatches(state.doc, storage.term, storage.cs);
            return DecorationSet.create(
              state.doc,
              ms.map((m, i) =>
                Decoration.inline(m.from, m.to, {
                  class: i === storage.index ? 'search-hit search-current' : 'search-hit',
                }),
              ),
            );
          },
        },
      }),
    ];
  },
});
