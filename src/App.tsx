import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Toolbar from '@/components/Toolbar';
import CodeEditor from '@/components/CodeEditor';
import EditablePreview from '@/components/EditablePreview';
import TableOfContents from '@/components/TableOfContents';
import StatusBar from '@/components/StatusBar';
import {
  type ViewMode,
  type ThemeName,
  type EffectiveTheme,
  type ThemeVars,
  THEMES,
  SAMPLE_MARKDOWN,
  getEffectiveTheme,
} from '@/types';

function App() {
  const [markdown, setMarkdown] = useState(() => {
    try {
      const saved = localStorage.getItem('md-editor-content');
      return saved || SAMPLE_MARKDOWN;
    } catch {
      return SAMPLE_MARKDOWN;
    }
  });
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('md-editor-theme') || 'system';
    } catch {
      return 'system';
    }
  });
  const [customThemes, setCustomThemes] = useState<Record<string, ThemeVars>>(() => {
    try {
      const saved = localStorage.getItem('md-editor-custom-themes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [themeEditorName, setThemeEditorName] = useState('');
  const [themeEditorJson, setThemeEditorJson] = useState('');
  const [showToc, setShowToc] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const dragCounterRef = useRef(0);

  // Persist markdown to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('md-editor-content', markdown);
    } catch { /* ignore */ }
  }, [markdown]);

  // Persist theme
  useEffect(() => {
    try {
      localStorage.setItem('md-editor-theme', theme);
    } catch { /* ignore */ }
  }, [theme]);

  // Persist custom themes
  useEffect(() => {
    try {
      localStorage.setItem('md-editor-custom-themes', JSON.stringify(customThemes));
    } catch { /* ignore */ }
  }, [customThemes]);

  // Compute effective theme and CSS variables
  const effectiveTheme: EffectiveTheme = useMemo(() => getEffectiveTheme(theme as ThemeName), [theme]);
  const themeVars = useMemo(() => customThemes[theme] || THEMES[effectiveTheme], [theme, customThemes, effectiveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system' && theme !== 'solarized') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      // Force re-render by toggling theme
      setTheme(t => t);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastExiting(false);
    setToast(msg);
    setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => {
        setToast(null);
        setToastExiting(false);
      }, 300);
    }, 2000);
  }, []);

  // File operations
  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setMarkdown(content);
      setFileName(file.name);
      setIsModified(false);
      showToast(`Opened: ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showToast]);

  const handleNewFile = useCallback(() => {
    setMarkdown('');
    setFileName(null);
    setIsModified(false);
    showToast('New document created');
  }, [showToast]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsModified(false);
    showToast('File downloaded!');
  }, [markdown, fileName, showToast]);

  // Export PDF via print
  const handleExportPdf = useCallback(() => {
    showToast("Opening print dialog...");
    setTimeout(() => window.print(), 100);
  }, [showToast]);

  // Theme management
  const handleOpenThemeDialog = useCallback(() => {
    setThemeEditorName('');
    setThemeEditorJson('');
    setShowThemeDialog(true);
  }, []);

  const handleSaveCustomTheme = useCallback(() => {
    const name = themeEditorName.trim();
    if (!name) {
      showToast('Theme name is required');
      return;
    }
    try {
      const vars = JSON.parse(themeEditorJson) as Record<string, string>;
      if (typeof vars !== 'object' || vars === null || !vars['--bg-primary']) {
        showToast('Must at minimum define --bg-primary');
        return;
      }
      setCustomThemes(prev => ({ ...prev, [name]: vars }));
      setTheme(name);
      setShowThemeDialog(false);
      showToast(`Theme "${name}" saved`);
    } catch {
      showToast('Invalid JSON');
    }
  }, [themeEditorName, themeEditorJson, showToast, setCustomThemes, setTheme]);

  const handleDeleteCustomTheme = useCallback((name: string) => {
    setCustomThemes(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (theme === name) setTheme('system');
    showToast(`Theme "${name}" deleted`);
  }, [theme, showToast, setTheme]);

  // Copy rendered
  const handleCopyRendered = useCallback(async () => {
    const previewEl = previewRef.current;
    if (!previewEl) {
      showToast('Switch to Preview or Split mode first');
      return;
    }

    try {
      const html = previewEl.innerHTML;
      const text = previewEl.innerText;
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      showToast('Copied as rich text!');
    } catch {
      try {
        await navigator.clipboard.writeText(previewEl.innerText);
        showToast('Copied as plain text');
      } catch {
        showToast('Copy failed — try manually');
      }
    }
  }, [showToast]);

  // Drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validTypes = ['.md', '.txt', '.markdown', '.mdown', '.mkd', '.mkdn', '.mdwn', '.mdtxt', '.mdtext'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(ext) && !file.type.startsWith('text/')) {
      showToast('Please drop a .md or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setMarkdown(content);
      setFileName(file.name);
      setIsModified(false);
      showToast(`Opened: ${file.name}`);
    };
    reader.readAsText(file);
  }, [showToast]);

  // Scroll sync
  const handleEditorScroll = useCallback(() => {
    if (isSyncingRef.current || viewMode !== 'split') return;
    isSyncingRef.current = true;

    const editor = editorRef.current;
    const preview = previewRef.current;
    if (editor && preview) {
      const maxScroll = editor.scrollHeight - editor.clientHeight;
      const ratio = maxScroll > 0 ? editor.scrollTop / maxScroll : 0;
      const previewMax = preview.scrollHeight - preview.clientHeight;
      preview.scrollTop = ratio * previewMax;
    }

    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, [viewMode]);

  const handlePreviewScroll = useCallback(() => {
    if (isSyncingRef.current || viewMode !== 'split') return;
    isSyncingRef.current = true;

    const editor = editorRef.current;
    const preview = previewRef.current;
    if (editor && preview) {
      const maxScroll = preview.scrollHeight - preview.clientHeight;
      const ratio = maxScroll > 0 ? preview.scrollTop / maxScroll : 0;
      const editorMax = editor.scrollHeight - editor.clientHeight;
      editor.scrollTop = ratio * editorMax;
    }

    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, [viewMode]);

  // Track modifications
  const handleChange = useCallback((value: string) => {
    setMarkdown(value);
    setIsModified(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        handleDownload();
      }
      if (mod && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      if (mod && e.key === 'n') {
        e.preventDefault();
        handleNewFile();
      }
      if (mod && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        handleExportPdf();
      }
      if (mod && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        handleCopyRendered();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        setTheme(prev => {
          const builtin = ['system','snow','ivory','navy','midnight','slate','ocean','storm','twilight','onyx','sepia'];
          const idx = builtin.indexOf(prev);
          return builtin[(idx + 1) % builtin.length];
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDownload, handleOpenFile, handleNewFile, handleCopyRendered, handleExportPdf]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{
        ...themeVars,
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.markdown,.mdown,.mkd,.mkdn,.mdwn,.mdtxt,.mdtext,text/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Toolbar (hidden in focus mode except toggle button) */}
      <Toolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        theme={theme}
        setTheme={setTheme}
        onOpenFile={handleOpenFile}
        onCopyRendered={handleCopyRendered}
        onDownload={handleDownload}
        onExportPdf={handleExportPdf}
        onNewFile={handleNewFile}
        showToc={showToc}
        setShowToc={setShowToc}
        fileName={fileName}
        isModified={isModified}
        customThemes={customThemes}
        onManageThemes={handleOpenThemeDialog}
        isFocusMode={isFocusMode}
        onToggleFocus={() => setIsFocusMode(p => !p)}
      />

      {/* Main content */}
      <div className={`flex flex-1 overflow-hidden ${isFocusMode ? 'focus-mode-active' : ''}`}>
        {/* TOC Sidebar */}
        {showToc && (
          <TableOfContents markdown={markdown} />
        )}

        {/* Editor / Preview / Split */}
        {viewMode === 'code' && (
          <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <CodeEditor
              ref={editorRef}
              value={markdown}
              onChange={handleChange}
              onScroll={handleEditorScroll}
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <EditablePreview
            markdown={markdown}
            onChange={handleChange}
            onScroll={handlePreviewScroll}
          />
        )}

        {viewMode === 'split' && (
          <>
            <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <CodeEditor
                ref={editorRef}
                value={markdown}
                onChange={handleChange}
                onScroll={handleEditorScroll}
              />
            </div>
            <div className="split-divider" />
            <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              <EditablePreview
                markdown={markdown}
                onChange={handleChange}
                onScroll={handlePreviewScroll}
              />
            </div>
          </>
        )}
      </div>

      {/* Status bar (hidden in focus mode) */}
      {!isFocusMode && <StatusBar markdown={markdown} />}

      {/* Drag overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
            <div>Drop your .md or .txt file here</div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toastExiting ? 'toast-out' : ''}`}>
          {toast}
        </div>
      )}

      {/* Theme dialog */}
      {showThemeDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowThemeDialog(false)}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-lg"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Custom Themes</h2>
              <button
                className="toolbar-btn"
                onClick={() => setShowThemeDialog(false)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Existing custom themes */}
            <div className="mb-4 space-y-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {Object.keys(customThemes).length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No custom themes yet.</p>
              )}
              {Object.entries(customThemes).map(([name]) => (
                <div key={name} className="flex items-center justify-between" style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                  <button
                    className="font-medium"
                    style={{ fontSize: 14, color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => { setTheme(name); setShowThemeDialog(false); }}
                  >
                    {name}
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => handleDeleteCustomTheme(name)}
                    style={{ padding: '2px 8px', fontSize: 12, color: 'var(--callout-caution-border, #ef4444)' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* New theme form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <input
                className="w-full mb-2"
                placeholder="Theme name (e.g. Monokai)"
                value={themeEditorName}
                onChange={(e) => setThemeEditorName(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <textarea
                className="w-full mb-3 font-mono"
                rows={6}
                placeholder='{
  "--bg-primary": "#1e1e1e",
  "--bg-secondary": "#252526",
  "--text-primary": "#d4d4d4",
  "--accent": "#569cd6"
}'
                value={themeEditorJson}
                onChange={(e) => setThemeEditorJson(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
              <button className="toolbar-btn" onClick={handleSaveCustomTheme} style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>
                Save Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
