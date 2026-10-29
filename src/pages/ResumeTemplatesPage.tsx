import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Gallery from "../document-editor/gallery/Gallery";
import {
  buildTemplateHtml,
  type Template,
} from "../document-editor/templates/generate";
import {
  listDocs,
  saveDoc,
  uid,
} from "../document-editor/store";
import {
  DEFAULT_PAGE,
  type SavedDoc,
} from "../document-editor/types";
import "../document-editor/styles.css";

import { ACTIVE_DOC_STORAGE_KEY } from "../document-editor/navigation";

export default function ResumeTemplatesPage() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<SavedDoc[]>(() => listDocs());

  const openTemplate = (template: Template | null) => {
    const doc: SavedDoc = {
      id: uid(),
      title: template ? template.name : "Untitled document",
      html: template ? buildTemplateHtml(template) : "<p></p>",
      updated: Date.now(),
      page: { ...DEFAULT_PAGE },
    };

    const saved = saveDoc(doc);
    if (!saved) {
      window.alert(
        "CareerLane could not save this document in browser storage. Export or remove an older document and try again."
      );
      return;
    }

    sessionStorage.setItem(ACTIVE_DOC_STORAGE_KEY, doc.id);
    navigate("/resume-template-editor", { state: { docId: doc.id } });
  };

  const openDocument = (doc: SavedDoc) => {
    sessionStorage.setItem(ACTIVE_DOC_STORAGE_KEY, doc.id);
    navigate("/resume-template-editor", { state: { docId: doc.id } });
  };

  return (
    <div className="doc-editor-host doc-editor-host--gallery">
      <div className="doc-editor-returnbar">
        <button type="button" onClick={() => navigate(-1)}>
          ← Back to CareerLane
        </button>
        <span>CareerLane AI · Resume Templates</span>
      </div>

      <Gallery
        recent={recent}
        onOpenTemplate={openTemplate}
        onOpenDoc={openDocument}
        onRecentChanged={() => setRecent(listDocs())}
      />
    </div>
  );
}
