import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { findMatches } from './search';

export default function FindReplace({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [term, setTerm] = useState('');
  const [rep, setRep] = useState('');
  const [cs, setCs] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
    return () => {
      editor.commands.clearSearch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    editor.commands.setSearch(term, cs);
  }, [term, cs, editor]);

  const total = term ? findMatches(editor.state.doc, term, cs).length : 0;
  const cur = editor.storage.searchReplace.index as number;

  return (
    <div className="findbox" role="dialog" aria-label="Find and replace">
      <div className="frow">
        <input
          ref={input}
          placeholder="Find"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.shiftKey ? editor.commands.findPrev() : editor.commands.findNext();
            if (e.key === 'Escape') onClose();
          }}
        />
        <span className="fcount">{term ? `${cur >= 0 ? cur + 1 : 0}/${total}` : ''}</span>
        <button title="Previous (Shift+Enter)" onClick={() => editor.commands.findPrev()}><ChevronUp size={14} /></button>
        <button title="Next (Enter)" onClick={() => editor.commands.findNext()}><ChevronDown size={14} /></button>
        <button title="Close" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="frow">
        <input
          placeholder="Replace with"
          value={rep}
          onChange={(e) => setRep(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        />
        <button className="ftxt" onClick={() => editor.commands.replaceCurrent(rep)}>Replace</button>
        <button className="ftxt" onClick={() => editor.commands.replaceAll(rep)}>All</button>
      </div>
      <label className="fcase">
        <input type="checkbox" checked={cs} onChange={(e) => setCs(e.target.checked)} /> Match case
      </label>
    </div>
  );
}
