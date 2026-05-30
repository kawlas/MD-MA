import type { ViewMode, ThemeVars } from '@/types';

interface ToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onOpenFile: () => void;
  onCopyRendered: () => void;
  onDownload: () => void;
  onExportPdf: () => void;
  onNewFile: () => void;
  showToc: boolean;
  setShowToc: (show: boolean) => void;
  fileName: string | null;
  isModified: boolean;
  customThemes: Record<string, ThemeVars>;
  onManageThemes: () => void;
}

export default function Toolbar({
  viewMode, setViewMode,
  theme, setTheme,
  onOpenFile, onCopyRendered, onDownload, onExportPdf, onNewFile,
  showToc, setShowToc,
  fileName, isModified,
  customThemes, onManageThemes,
}: ToolbarProps) {
  return (
    <div
      className="toolbar-container flex items-center gap-2 px-3 py-2 select-none"
      style={{
        background: 'var(--bg-toolbar)',
        borderBottom: '1px solid var(--border)',
        minHeight: 48,
      }}
    >
      {/* Left: App name & file actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: -0.5 }}>
            MD
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.3 }}>
            Editor
          </span>
        </div>

        <button className="toolbar-btn" onClick={onNewFile} title="New file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <span className="hidden sm:inline">New</span>
        </button>

        <button className="toolbar-btn" onClick={onOpenFile} title="Open file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span className="hidden sm:inline">Open</span>
        </button>

        <button className="toolbar-btn" onClick={onDownload} title="Download file (Cmd/Ctrl+S)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span className="hidden sm:inline">Save</span>
        </button>

        <button className="toolbar-btn" onClick={onExportPdf} title="Export PDF (Cmd/Ctrl+Shift+P)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M12 12v6"/></svg>
          <span className="hidden sm:inline">PDF</span>
        </button>

        {fileName && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 150 }} className="truncate hidden md:inline">
            {fileName}{isModified ? ' •' : ''}
          </span>
        )}
      </div>

      {/* Center: View mode */}
      <div className="flex-1 flex justify-center">
        <div className="segmented-control">
          <button
            className={`segmented-btn ${viewMode === 'code' ? 'segmented-btn-active' : ''}`}
            onClick={() => setViewMode('code')}
            title="Code mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-3.5 h-3.5 mr-1 align-[-2px]"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Code
          </button>
          <button
            className={`segmented-btn ${viewMode === 'preview' ? 'segmented-btn-active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="Preview mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-3.5 h-3.5 mr-1 align-[-2px]"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </button>
          <button
            className={`segmented-btn ${viewMode === 'split' ? 'segmented-btn-active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-3.5 h-3.5 mr-1 align-[-2px]"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
            Split
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          className={`toolbar-btn ${showToc ? 'toolbar-btn-active' : ''}`}
          onClick={() => setShowToc(!showToc)}
          title="Table of Contents"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <span className="hidden lg:inline">TOC</span>
        </button>

        <button className="toolbar-btn" onClick={onCopyRendered} title="Copy rendered as rich text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span className="hidden lg:inline">Copy</span>
        </button>

        <select
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          title="Change theme"
        >
          <option value="system">🖥 System</option>
          <option value="sepia">📜 Sepia</option>
          <option value="nord">❄️ Nord</option>
          <option value="solarized">☀️ Solarized</option>
          {Object.keys(customThemes).map((name) => (
            <option key={name} value={name}>🎨 {name}</option>
          ))}
        </select>

        <button className="toolbar-btn" onClick={onManageThemes} title="Manage custom themes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>
  );
}
