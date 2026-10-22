import { useState, useCallback, useRef, useEffect, memo } from "react";
import type { ViewMode } from "@/types";
import { useT } from "@/i18n";

interface ToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onOpenFile: () => void;
  onCopyRendered: () => void;
  onSaveAs: () => void;
  onExportPdf: () => void;
  onNewFile: () => void;
  showToc: boolean;
  setShowToc: (show: boolean) => void;
  fileName: string | null;
  isModified: boolean;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenSettings: () => void;
}

export default memo(function Toolbar({
  viewMode,
  setViewMode,
  onOpenFile,
  onCopyRendered,
  onSaveAs,
  onExportPdf,
  onNewFile,
  showToc,
  setShowToc,
  fileName,
  isModified,
  isFocusMode,
  onToggleFocus,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenSettings,
}: ToolbarProps) {
  const _t = useT();
  const [editingFileName, setEditingFileName] = useState(false);
  const [fileNameDraft, setFileNameDraft] = useState("");
  const fileNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingFileName && fileNameInputRef.current) {
      fileNameInputRef.current.focus();
      fileNameInputRef.current.select();
    }
  }, [editingFileName]);

  const handleFileNameStart = useCallback(() => {
    if (fileName) {
      setFileNameDraft(fileName);
      setEditingFileName(true);
    }
  }, [fileName]);

  const handleFileNameSave = useCallback(() => {
    setEditingFileName(false);
  }, []);

  return (
    <div
      className="toolbar-container"
      style={{
        borderBottom: isFocusMode ? "none" : "1px solid var(--border)",
        display: isFocusMode ? "none" : "flex",
      }}
    >
      {/* Left: document actions */}
      <div className="flex items-center gap-1.5 toolbar-left">
        <span className="toolbar-logo hide-narrow">MD-MA</span>

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn"
          onClick={onUndo}
          title={_t("toolbar.undo") + " (Cmd+Z)"}
          style={{ opacity: canUndo ? 1 : 0.35 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          className="toolbar-btn"
          onClick={onRedo}
          title={_t("toolbar.redo") + " (Cmd+Shift+Z)"}
          style={{ opacity: canRedo ? 1 : 0.35 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        <button className="toolbar-btn" onClick={onNewFile} title={_t("toolbar.new")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </button>
        <button className="toolbar-btn" onClick={onOpenFile} title={_t("toolbar.open")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button className="toolbar-btn" onClick={onSaveAs} title={_t("toolbar.save") + " (Cmd+S)"}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>

        {/* Inline file name */}
        {editingFileName ? (
          <input
            ref={fileNameInputRef}
            className="filename-input"
            value={fileNameDraft}
            onChange={(e) => setFileNameDraft(e.target.value)}
            onBlur={handleFileNameSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFileNameSave();
              if (e.key === "Escape") setEditingFileName(false);
            }}
            style={{
              fontSize: 12,
              width: 100,
              color: "var(--text-primary)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--accent)",
              borderRadius: 4,
              padding: "2px 6px",
            }}
          />
        ) : (
          fileName && (
            <span
              className="truncate filename-display hide-narrow"
              onClick={handleFileNameStart}
              title={_t("preview.click_to_edit")}
              style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 100, cursor: "pointer" }}
            >
              {fileName}
              {isModified ? " ●" : ""}
            </span>
          )
        )}

        <div className="toolbar-divider hidden md:block" />
      </div>

      {/* Center: view mode */}
      <div className="flex-1 flex items-center gap-2 justify-center toolbar-center">
        <div className="segmented-control">
          <button
            className={`segmented-btn ${viewMode === "code" ? "segmented-btn-active" : ""}`}
            onClick={() => setViewMode("code")}
            title={_t("toolbar.code")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline w-3.5 h-3.5 align-[-2px]"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span className="hidden xs:inline">{_t("toolbar.code")}</span>
          </button>
          <button
            className={`segmented-btn ${viewMode === "preview" ? "segmented-btn-active" : ""}`}
            onClick={() => setViewMode("preview")}
            title={_t("toolbar.preview")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline w-3.5 h-3.5 align-[-2px]"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="hidden xs:inline">{_t("toolbar.preview")}</span>
          </button>
          <button
            className={`segmented-btn ${viewMode === "split" ? "segmented-btn-active" : ""}`}
            onClick={() => setViewMode("split")}
            title={_t("toolbar.split")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline w-3.5 h-3.5 align-[-2px]"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            <span className="hidden xs:inline">{_t("toolbar.split")}</span>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 toolbar-right" style={{ justifyContent: "flex-end" }}>
        <button
          className={`toolbar-btn ${showToc ? "toolbar-btn-active" : ""}`}
          onClick={() => setShowToc(!showToc)}
          title={_t("toolbar.outline")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>

        <button className="toolbar-btn hidden md:flex hide-narrow" onClick={onExportPdf} title={_t("toolbar.pdf")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 15h6" />
            <path d="M12 12v6" />
          </svg>
        </button>

        <button className="toolbar-btn hide-narrow" onClick={onCopyRendered} title={_t("toolbar.copy")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        <button
          className={`toolbar-btn ${isFocusMode ? "toolbar-btn-active" : ""}`}
          onClick={onToggleFocus}
          title={_t("toolbar.focus")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={onOpenSettings} title="Settings">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
});
