import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DocEditor from "../document-editor/editor/DocEditor";
import { listDocs } from "../document-editor/store";
import type { SavedDoc } from "../document-editor/types";
import { ACTIVE_DOC_STORAGE_KEY } from "../document-editor/navigation";
import "../document-editor/styles.css";

type EditorLocationState = {
  docId?: string;
};

export default function ResumeTemplateEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = (location.state || null) as EditorLocationState | null;

  const docId =
    locationState?.docId ||
    new URLSearchParams(location.search).get("docId") ||
    sessionStorage.getItem(ACTIVE_DOC_STORAGE_KEY) ||
    "";

  const doc = useMemo<SavedDoc | null>(() => {
    if (!docId) return null;
    return listDocs().find((item) => item.id === docId) || null;
  }, [docId]);

  if (!doc) {
    return (
      <div className="doc-editor-host doc-editor-host--editor">
        <div className="doc-editor-recovery">
          <h2>Document not found</h2>
          <p>
            This document may have been removed or browser storage may have been cleared.
          </p>
          <button
            type="button"
            onClick={() => navigate("/resume-templates", { replace: true })}
          >
            Back to templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-editor-host doc-editor-host--editor">
      <DocEditor
        key={doc.id}
        doc={doc}
        onBack={() => navigate("/resume-templates")}
      />
    </div>
  );
}
