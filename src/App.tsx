import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Toolbar from '@/components/Toolbar';
import CodeEditor from '@/components/CodeEditor';
import EditablePreview from '@/components/EditablePreview';
import TableOfContents from '@/components/TableOfContents';
import StatusBar from '@/components/StatusBar';
import CommandPalette from '@/components/CommandPalette';
import {
  type ViewMode,
  type ThemeName,
  type EffectiveTheme,
  type ThemeVars,
  type FontSet,
  THEMES,
  FONT_SETS,
  SAMPLE_MARKDOWN,
  getEffectiveTheme,
  parseBlocks,
  extractToc,
  stripMarkdown,
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
  const [fontSet, setFontSet] = useState<FontSet>(() => {
    try {
      const saved = localStorage.getItem('md-editor-font-set');
      if (saved) {
        const parsed = JSON.parse(saved);
        return FONT_SETS.find(f => f.label === parsed.label) || FONT_SETS[0];
      }
    } catch { /* ignore */ }
    return FONT_SETS[0];
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [themeEditorName, setThemeEditorName] = useState('');
  const [themeEditorJson, setThemeEditorJson] = useState('');
  const [showToc, setShowToc] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [splitRatio, setSplitRatio] = useState(() => {
    try { return Number(localStorage.getItem('md-editor-split-ratio')) || 0.5; } catch { return 0.5; }
  });
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'new' | null>(null);

  // Preview debounce
  const [previewMarkdown, setPreviewMarkdown] = useState(markdown);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Undo/redo history
  const historyRef = useRef<string[]>([markdown]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLen, setHistoryLen] = useState(1);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isUndoingRef = useRef(false);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLen - 1;

  // Font/line adjustments (relative to current font set)
  const [fontSizeDelta, setFontSizeDelta] = useState(() => {
    try { return Number(localStorage.getItem('md-editor-font-size-delta')) || 0; } catch { return 0; }
  });
  const [lineHeightDelta, setLineHeightDelta] = useState(() => {
    try { return Number(localStorage.getItem('md-editor-line-height-delta')) || 0; } catch { return 0; }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const syncLockRef = useRef(0);
  const dragCounterRef = useRef(0);
  const editorScrollRafRef = useRef<number | undefined>(undefined);
  const previewScrollRafRef = useRef<number | undefined>(undefined);

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

  // Persist font set
  useEffect(() => {
    try {
      localStorage.setItem('md-editor-font-set', JSON.stringify(fontSet));
    } catch { /* ignore */ }
  }, [fontSet]);

  // Persist split ratio
  useEffect(() => {
    try { localStorage.setItem('md-editor-split-ratio', String(splitRatio)); } catch { /* ignore */ }
  }, [splitRatio]);

  // Apply font set + deltas as CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const bodySize = Math.max(10, fontSet.bodySize + fontSizeDelta);
    const codeSize = Math.max(9, fontSet.codeSize + fontSizeDelta * 0.8);
    const lineH = Math.max(1.2, fontSet.lineHeight + lineHeightDelta * 0.1);
    root.style.setProperty('--font-body', fontSet.body);
    root.style.setProperty('--font-code', fontSet.code);
    root.style.setProperty('--font-size-body', `${bodySize}px`);
    root.style.setProperty('--font-size-code', `${codeSize}px`);
    root.style.setProperty('--line-height-body', `${lineH}`);
  }, [fontSet, fontSizeDelta, lineHeightDelta]);

  // Persist font/line deltas
  useEffect(() => { try { localStorage.setItem('md-editor-font-size-delta', String(fontSizeDelta)); } catch { /* ignore */ } }, [fontSizeDelta]);
  useEffect(() => { try { localStorage.setItem('md-editor-line-height-delta', String(lineHeightDelta)); } catch { /* ignore */ } }, [lineHeightDelta]);

  // Cleanup timers / RAFs on unmount
  useEffect(() => () => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (editorScrollRafRef.current) cancelAnimationFrame(editorScrollRafRef.current);
    if (previewScrollRafRef.current) cancelAnimationFrame(previewScrollRafRef.current);
  }, []);

  // Compute effective theme and CSS variables
  const effectiveTheme: EffectiveTheme = useMemo(() => getEffectiveTheme(theme as ThemeName), [theme]);
  const themeVars = useMemo(() => customThemes[theme] || THEMES[effectiveTheme], [theme, customThemes, effectiveTheme]);
  const blocks = useMemo(() => parseBlocks(markdown), [markdown]);
  const tocItems = useMemo(() => extractToc(markdown), [markdown]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
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
    if (file.name.toLowerCase().endsWith('.pdf')) {
      showToast('PDF files are not supported — this app edits Markdown (.md) files only');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setMarkdown(content);
      setPreviewMarkdown(content);
      setFileName(file.name);
      setIsModified(false);
      showToast(`Opened: ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showToast]);

  const doNewFile = useCallback(() => {
    setMarkdown('');
    setPreviewMarkdown('');
    setFileName(null);
    setIsModified(false);
    setPendingAction(null);
    showToast('New document created');
  }, [showToast]);

  const handleNewFile = useCallback(() => {
    if (isModified || markdown.length > 0) {
      setPendingAction('new');
      return;
    }
    doNewFile();
  }, [isModified, markdown, doNewFile]);

  const handleSaveAs = useCallback(async (): Promise<boolean> => {
    try {
      const suggested = fileName || 'document.md';
      const opts: SaveFilePickerOptions = {
        suggestedName: suggested,
        types: [
          {
            description: 'Markdown',
            accept: { 'text/markdown': ['.md', '.markdown', '.mdown'] },
          },
          {
            description: 'Plain Text',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      };
      const isTxt = (name: string) => name.toLowerCase().endsWith('.txt');
      const content = (name: string) => isTxt(name) ? stripMarkdown(markdown) : markdown;
      const handle = await window.showSaveFilePicker?.(opts);
      if (!handle) {
        // Fallback: download
        const ext = fileName?.endsWith('.txt') ? '.txt' : '.md';
        const mime = ext === '.txt' ? 'text/plain' : 'text/markdown';
        const text = content(fileName || `document${ext}`);
        const blob = new Blob([text], { type: `${mime};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `document${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsModified(false);
        showToast('File downloaded!');
        return true;
      }
      const text = content(handle.name);
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      setFileName(handle.name);
      setIsModified(false);
      showToast(`Saved: ${handle.name}`);
      return true;
    } catch {
      showToast('Save cancelled');
      return false;
    }
  }, [markdown, fileName, showToast]);

  const handleConfirmDiscard = useCallback(() => {
    if (pendingAction === 'new') doNewFile();
    else setPendingAction(null);
  }, [pendingAction, doNewFile]);

  const handleConfirmCancel = useCallback(() => {
    setPendingAction(null);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    const saved = await handleSaveAs();
    if (saved && pendingAction === 'new') {
      doNewFile();
    }
  }, [handleSaveAs, pendingAction, doNewFile]);

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

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    isUndoingRef.current = true;
    const newIdx = historyIndex - 1;
    const val = historyRef.current[newIdx];
    setMarkdown(val);
    setPreviewMarkdown(val);
    setIsModified(true);
    setHistoryIndex(newIdx);
    requestAnimationFrame(() => { isUndoingRef.current = false; });
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    const hist = historyRef.current;
    if (historyIndex >= hist.length - 1) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    isUndoingRef.current = true;
    const newIdx = historyIndex + 1;
    const val = hist[newIdx];
    setMarkdown(val);
    setPreviewMarkdown(val);
    setIsModified(true);
    setHistoryIndex(newIdx);
    requestAnimationFrame(() => { isUndoingRef.current = false; });
  }, [historyIndex]);

  // Font size adjustments
  const handleIncreaseFontSize = useCallback(() => setFontSizeDelta(d => Math.min(d + 1, 12)), []);
  const handleDecreaseFontSize = useCallback(() => setFontSizeDelta(d => Math.max(d - 1, -8)), []);
  const handleIncreaseLineHeight = useCallback(() => setLineHeightDelta(d => Math.min(d + 1, 8)), []);
  const handleDecreaseLineHeight = useCallback(() => setLineHeightDelta(d => Math.max(d - 1, -6)), []);
  const handleResetFont = useCallback(() => {
    setFontSet(FONT_SETS[0]);
    setFontSizeDelta(0);
    setLineHeightDelta(0);
    showToast('Font reset to defaults');
  }, [showToast]);

  const handleOpenSettings = useCallback(() => {
    setShowSettingsPanel(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettingsPanel(false);
  }, []);

  const settingsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showSettingsPanel) return;
    const onMouseDown = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsPanel(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showSettingsPanel]);

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
      setPreviewMarkdown(content);
      setFileName(file.name);
      setIsModified(false);
      showToast(`Opened: ${file.name}`);
    };
    reader.readAsText(file);
  }, [showToast]);

  const getEditorLineHeight = useCallback((editor: HTMLTextAreaElement): number => {
    const lineHeight = Number.parseFloat(window.getComputedStyle(editor).lineHeight);
    return Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 22;
  }, []);

  // Ratio-based fallback for scroll sync
  const applyRatioSync = useCallback((
    source: { scrollTop: number; scrollHeight: number; clientHeight: number },
    target: HTMLElement,
  ): number | null => {
    const maxSource = source.scrollHeight - source.clientHeight;
    const maxTarget = target.scrollHeight - target.clientHeight;
    if (maxSource <= 0 || maxTarget <= 0) return null;
    return (source.scrollTop / maxSource) * maxTarget;
  }, []);

  // Scroll sync — bidirectional block-anchor mapping with ratio fallback.
  const handleEditorScroll = useCallback(() => {
    if (Date.now() - syncLockRef.current < 50) return;
    const editor = editorRef.current;
    if (!editor) return;

    const lineHeight = getEditorLineHeight(editor);
    const topLine = Math.max(0, Math.floor(editor.scrollTop / lineHeight));
    const activeHeading = [...tocItems].reverse().find(item => item.line <= topLine);
    setActiveHeadingId(activeHeading?.id);

    if (viewMode !== 'split') return;
    const preview = previewRef.current;
    if (!preview) return;

    syncLockRef.current = Date.now();

    // Try block-based sync first
    const blockIndex = blocks.findIndex(block => topLine >= block.startLine && topLine <= block.endLine);
    if (blockIndex >= 0) {
      const block = blocks[blockIndex];
      const currentEl = preview.querySelector<HTMLElement>(`[data-block-id="${block.id}"]`);
      if (currentEl) {
        const blockLineSpan = Math.max(1, block.endLine - block.startLine + 1);
        const linesIntoBlock = topLine - block.startLine;
        let targetScrollTop = currentEl.offsetTop;

        const nextBlock = blocks[blockIndex + 1];
        if (nextBlock) {
          const nextEl = preview.querySelector<HTMLElement>(`[data-block-id="${nextBlock.id}"]`);
          if (nextEl) {
            const blockHeightInPixels = nextEl.offsetTop - currentEl.offsetTop;
            targetScrollTop += (linesIntoBlock / blockLineSpan) * blockHeightInPixels;
            preview.scrollTop = targetScrollTop;
            return;
          }
        } else {
          const blockHeight = currentEl.offsetHeight;
          if (blockHeight > 0) {
            const targetPixelOffset = (linesIntoBlock / blockLineSpan) * blockHeight;
            targetScrollTop += Math.min(targetPixelOffset, blockHeight - preview.clientHeight / 2);
            preview.scrollTop = targetScrollTop;
            return;
          }
        }
        preview.scrollTop = targetScrollTop;
        return;
      }
    }

    // Fallback: ratio-based sync
    const ratioTarget = applyRatioSync(editor, preview);
    if (ratioTarget !== null) {
      preview.scrollTop = ratioTarget;
    }
  }, [viewMode, blocks, tocItems, getEditorLineHeight, applyRatioSync]);

  const handlePreviewScroll = useCallback(() => {
    if (Date.now() - syncLockRef.current < 50) return;
    const preview = previewRef.current;
    if (!preview) return;

    const blockElements = Array.from(preview.querySelectorAll<HTMLElement>('[data-block-id]'));
    if (blockElements.length === 0) return;
    const top = preview.scrollTop + 1;
    let activeEl = blockElements[0];
    for (const el of blockElements) {
      if (el.offsetTop <= top) activeEl = el;
      else break;
    }

    const startLine = Number(activeEl.dataset.sourceStartLine) || 0;
    const activeHeading = [...tocItems].reverse().find(item => item.line <= startLine);
    setActiveHeadingId(activeHeading?.id);

    if (viewMode !== 'split') return;
    const editor = editorRef.current;
    if (!editor) return;
    const lineHeight = getEditorLineHeight(editor);

    syncLockRef.current = Date.now();

    // Calculate offset within block for more accurate mapping
    const endLineRaw = activeEl.dataset.sourceEndLine;
    const endLine = endLineRaw ? Number(endLineRaw) : startLine;
    const blockLineSpan = Math.max(1, endLine - startLine + 1);
    const blockOffset = top - activeEl.offsetTop;
    const blockHeight = activeEl.offsetHeight;
    if (blockHeight > 0) {
      const linesIntoBlock = Math.round((blockOffset / blockHeight) * blockLineSpan);
      const targetLine = Math.max(0, startLine + Math.min(linesIntoBlock, blockLineSpan - 1));
      editor.scrollTop = targetLine * lineHeight;
    } else {
      editor.scrollTop = startLine * lineHeight;
    }
  }, [viewMode, tocItems, getEditorLineHeight]);

  // Ref proxies — always call latest scroll handler
  const editorScrollRef = useRef<() => void>(() => {});
  const previewScrollRef = useRef<() => void>(() => {});
  useEffect(() => { editorScrollRef.current = handleEditorScroll; });
  useEffect(() => { previewScrollRef.current = handlePreviewScroll; });

  // Stable RAF-throttled callbacks for components (never recreate, always up-to-date via refs)
  const onEditorScroll = useCallback(() => {
    if (editorScrollRafRef.current) return;
    editorScrollRafRef.current = requestAnimationFrame(() => {
      editorScrollRafRef.current = undefined;
      editorScrollRef.current();
    });
  }, []);
  const onPreviewScroll = useCallback(() => {
    if (previewScrollRafRef.current) return;
    previewScrollRafRef.current = requestAnimationFrame(() => {
      previewScrollRafRef.current = undefined;
      previewScrollRef.current();
    });
  }, []);

  // Command palette commands
  const paletteCommands = useMemo<{ id: string; label: string; category: string; shortcut?: string; action: () => void }[]>(() => [
    { id: 'view-code', label: 'Code View', category: 'View', shortcut: '⌘1', action: () => setViewMode('code') },
    { id: 'view-preview', label: 'Preview View', category: 'View', shortcut: '⌘2', action: () => setViewMode('preview') },
    { id: 'view-split', label: 'Split View', category: 'View', shortcut: '⌘3', action: () => setViewMode('split') },
    { id: 'toggle-focus', label: 'Toggle Focus Mode', category: 'View', shortcut: '⌘⇧F', action: () => setIsFocusMode(p => !p) },
    { id: 'toggle-outline', label: 'Toggle Outline', category: 'View', shortcut: '⌘⇧T', action: () => setShowToc(p => !p) },
    { id: 'new-file', label: 'New File', category: 'File', shortcut: '⌘N', action: handleNewFile },
    { id: 'open-file', label: 'Open File', category: 'File', shortcut: '⌘O', action: handleOpenFile },
    { id: 'save', label: 'Save', category: 'File', shortcut: '⌘S', action: handleSaveAs },
    { id: 'save-as', label: 'Save As', category: 'File', shortcut: '⌘⇧S', action: handleSaveAs },
    { id: 'export-pdf', label: 'Export PDF', category: 'Export', shortcut: '⌘⇧P', action: handleExportPdf },
    { id: 'copy-rtf', label: 'Copy as Rich Text', category: 'Export', shortcut: '⌘⇧C', action: handleCopyRendered },
    { id: 'undo', label: 'Undo', category: 'Edit', shortcut: '⌘Z', action: handleUndo },
    { id: 'redo', label: 'Redo', category: 'Edit', shortcut: '⌘⇧Z', action: handleRedo },
    { id: 'font-inc', label: 'Increase Font Size', category: 'Font', action: handleIncreaseFontSize },
    { id: 'font-dec', label: 'Decrease Font Size', category: 'Font', action: handleDecreaseFontSize },
    { id: 'font-reset', label: 'Reset Font', category: 'Font', action: handleResetFont },
    { id: 'line-inc', label: 'Increase Line Height', category: 'Font', action: handleIncreaseLineHeight },
    { id: 'line-dec', label: 'Decrease Line Height', category: 'Font', action: handleDecreaseLineHeight },
    { id: 'settings', label: 'Open Settings', category: 'App', action: handleOpenSettings },
  ], [handleNewFile, handleOpenFile, handleSaveAs, handleExportPdf, handleCopyRendered, handleUndo, handleRedo, handleIncreaseFontSize, handleDecreaseFontSize, handleResetFont, handleIncreaseLineHeight, handleDecreaseLineHeight, handleOpenSettings]);

  // Push current markdown to history stack (debounced)
  const pushHistory = useCallback((value: string) => {
    const hist = historyRef.current;
    // Trim any future entries (when user undid and then typed something new)
    hist.length = historyIndex + 1;
    hist.push(value);
    if (hist.length > 200) hist.shift();
    setHistoryIndex(hist.length - 1);
    setHistoryLen(hist.length);
  }, [historyIndex]);

  // Track modifications + push to history (debounced per keystroke)
  const handleChange = useCallback((value: string) => {
    setMarkdown(value);
    setIsModified(true);
    if (isUndoingRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushHistory(value);
    }, 400);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      setPreviewMarkdown(value);
    }, 200);
  }, [pushHistory]);

  // Tauri native menu event listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        unlisten = await listen<string>('menu-event', (event) => {
          const action = event.payload;
          switch (action) {
            case 'new_file': handleNewFile(); break;
            case 'open_file': handleOpenFile(); break;
            case 'save':
            case 'save_as': handleSaveAs(); break;
            case 'export_pdf': handleExportPdf(); break;
            case 'copy_rtf': handleCopyRendered(); break;
            case 'undo': handleUndo(); break;
            case 'redo': handleRedo(); break;
            case 'toggle_toc': setShowToc(p => !p); break;
            case 'toggle_focus': setIsFocusMode(p => !p); break;
            case 'close_window': getCurrentWindow().close(); break;
            case 'about': showToast('MD MA v0.1.0 — a premium Markdown editor'); break;
            case 'zoom': getCurrentWindow().toggleMaximize(); break;
            case 'hide_others': showToast('Hide Others'); break;
            case 'show_all': showToast('Show All'); break;
          }
        });
      } catch {
        // Not running inside Tauri — ignore
      }
    })();
    return () => { unlisten?.(); };
  }, [handleSaveAs, handleOpenFile, handleNewFile, handleCopyRendered, handleExportPdf, handleUndo, handleRedo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === 's') { e.preventDefault(); handleSaveAs(); return; }
      if (mod && key === 'o') { e.preventDefault(); handleOpenFile(); return; }
      if (mod && key === 'n') { e.preventDefault(); handleNewFile(); return; }
      if (mod && e.shiftKey && key === 'p') { e.preventDefault(); handleExportPdf(); return; }
      if (mod && e.shiftKey && key === 'z') { e.preventDefault(); handleRedo(); return; }
      if (mod && !e.shiftKey && key === 'z') { e.preventDefault(); handleUndo(); return; }
      if (mod && !e.shiftKey && key === 'k') { e.preventDefault(); setShowCommandPalette(p => !p); return; }
      if (mod && e.shiftKey && key === 'c') { e.preventDefault(); handleCopyRendered(); return; }
      if (key === 'f5') { e.preventDefault(); setTheme(prev => {
        const builtin = ['system','snow','githubDark','nord','tokyoNight','solarizedLight','solarizedDark','ivory','navy','midnight','slate','ocean','storm','twilight','onyx','sepia'];
        const idx = builtin.indexOf(prev);
        return builtin[(idx + 1) % builtin.length];
      }); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveAs, handleOpenFile, handleNewFile, handleCopyRendered, handleExportPdf, handleUndo, handleRedo]);

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
          onSaveAs={handleSaveAs}
          onExportPdf={handleExportPdf}
          onNewFile={handleNewFile}
          showToc={showToc}
          setShowToc={setShowToc}
          fileName={fileName}
          isModified={isModified}
          isFocusMode={isFocusMode}
          onToggleFocus={() => setIsFocusMode(p => !p)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onOpenSettings={handleOpenSettings}
        />

      {/* Main content */}
      <div className={`app-main view-${viewMode} flex flex-1 overflow-hidden ${isFocusMode ? 'focus-mode-active' : ''}`}>
        {/* Focus mode exit button */}
        {isFocusMode && (
          <button className="focus-exit-btn" onClick={() => setIsFocusMode(false)}>
            Exit Focus
          </button>
        )}

        {/* TOC Sidebar */}
        {showToc && (
          <TableOfContents markdown={markdown} activeId={activeHeadingId} />
        )}

        {/* Editor / Preview / Split */}
        {viewMode === 'code' && (
          <div className="editor-pane flex-1 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <CodeEditor
              ref={editorRef}
              value={markdown}
              onChange={handleChange}
              onScroll={onEditorScroll}
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="preview-pane flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            <EditablePreview
              ref={previewRef}
              markdown={previewMarkdown}
              onChange={handleChange}
              onScroll={onPreviewScroll}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <>
            <div className="editor-pane flex-1 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <CodeEditor
                ref={editorRef}
                value={markdown}
                onChange={handleChange}
                onScroll={onEditorScroll}
              />
            </div>
            <div className="split-divider" />
            <div className="preview-pane flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              <EditablePreview
                ref={previewRef}
                markdown={previewMarkdown}
                onChange={handleChange}
                onScroll={onPreviewScroll}
              />
            </div>
          </>
        )}
      </div>

      {/* Status bar (hidden in focus mode) */}
      {!isFocusMode && <StatusBar markdown={markdown} fileName={fileName} />}

      {/* Command palette */}
      {showCommandPalette && (
        <CommandPalette commands={paletteCommands} onClose={() => setShowCommandPalette(false)} />
      )}

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

      {/* Unsaved changes confirm dialog */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={handleConfirmCancel}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-sm"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Unsaved Changes
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex gap-2 justify-end">
              <button className="toolbar-btn" onClick={handleConfirmCancel}>
                Cancel
              </button>
              <button className="toolbar-btn" onClick={handleConfirmDiscard} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                Discard
              </button>
              <button className="toolbar-btn" onClick={handleConfirmSave} style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings panel (gear icon) — floating dropdown, no backdrop */}
      {showSettingsPanel && (
        <div
          ref={settingsRef}
          className="settings-dropdown"
          style={{
            position: 'fixed',
            top: 56,
            right: 12,
            width: 340,
            maxHeight: 'calc(100vh - 72px)',
            overflowY: 'auto',
            zIndex: 1000,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h2>
            <button className="toolbar-btn" onClick={handleCloseSettings} style={{ padding: '4px 8px' }}>✕</button>
          </div>

            {/* Theme section */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Theme</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(['system', 'snow', 'githubDark', 'nord', 'tokyoNight', 'solarizedLight', 'solarizedDark', 'ivory', 'navy', 'midnight', 'slate', 'ocean', 'storm', 'twilight', 'onyx', 'sepia'] as const).map((t) => {
                  const effective = t === 'system' ? undefined : THEMES[t];
                  const accent = effective?.['--accent'] ?? '#60a5fa';
                  const bg = effective?.['--bg-primary'] ?? '#0f172a';
                  const label = t.charAt(0).toUpperCase() + t.slice(1);
                  const isActive = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => { setTheme(t); }}
                      title={label}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        border: isActive ? `2px solid var(--accent)` : `2px solid var(--border)`,
                        background: bg,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 0 2px var(--accent-bg)' : 'none',
                      }}
                    >
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: accent,
                        display: 'block',
                      }} />
                      {t === 'system' && (
                        <span style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          fontSize: 10,
                          background: 'var(--bg-primary)',
                          color: 'var(--text-muted)',
                          borderRadius: 4,
                          padding: '0 3px',
                          border: '1px solid var(--border)',
                          lineHeight: '14px',
                        }}>A</span>
                      )}
                    </button>
                  );
                })}
                {Object.keys(customThemes).map((name) => {
                  const vars = customThemes[name];
                  const accent = vars['--accent'] ?? '#60a5fa';
                  const bg = vars['--bg-primary'] ?? '#0f172a';
                  const isActive = theme === name;
                  return (
                    <button
                      key={name}
                      onClick={() => { setTheme(name); }}
                      title={name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        border: isActive ? `2px solid var(--accent)` : `2px solid var(--border)`,
                        background: bg,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 0 2px var(--accent-bg)' : 'none',
                      }}
                    >
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: accent, display: 'block' }} />
                    </button>
                  );
                })}
              </div>
              <button
                className="toolbar-btn"
                onClick={() => { handleOpenThemeDialog(); handleCloseSettings(); }}
                style={{ marginTop: 8, fontSize: 12 }}
              >
                Custom themes…
              </button>
            </div>

            {/* Font section */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Font</h3>
              <div className="space-y-2">
                {FONT_SETS.map((fs) => (
                  <button
                    key={fs.label}
                    className="w-full text-left"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: fontSet.label === fs.label ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: fontSet.label === fs.label ? 'white' : 'var(--text-primary)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => { setFontSet(fs); showToast(`Font: ${fs.label}`); }}
                  >
                    <span style={{ fontWeight: 600 }}>{fs.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8, fontFamily: fs.body }}>{fs.body.split(',')[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus mode */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Reading density</h3>
              <div className="flex flex-wrap gap-2">
                <button className="toolbar-btn" onClick={handleDecreaseFontSize}>A-</button>
                <button className="toolbar-btn" onClick={handleIncreaseFontSize}>A+</button>
                <button className="toolbar-btn" onClick={handleDecreaseLineHeight}>Tight</button>
                <button className="toolbar-btn" onClick={handleIncreaseLineHeight}>Roomy</button>
                <button className="toolbar-btn" onClick={handleResetFont}>Reset</button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Display</h3>
              <button
                className="toolbar-btn"
                onClick={() => { setIsFocusMode(p => !p); handleCloseSettings(); }}
                style={{ background: isFocusMode ? 'var(--accent-bg)' : 'transparent', color: isFocusMode ? 'var(--accent)' : 'var(--text-secondary)', borderColor: isFocusMode ? 'var(--accent)' : 'var(--border)' }}
              >
                {isFocusMode ? '✓ ' : ''}Focus mode
              </button>
            </div>
        </div>
      )}

      {/* Font dialog */}
      {showFontDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowFontDialog(false)}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-md"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Font Sets</h2>
              <button
                className="toolbar-btn"
                onClick={() => setShowFontDialog(false)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {FONT_SETS.map((fs) => (
                <button
                  key={fs.label}
                  className="w-full text-left"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: fontSet.label === fs.label ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: fontSet.label === fs.label ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.15s ease',
                    fontFamily: fs.body,
                  }}
                  onClick={() => { setFontSet(fs); setShowFontDialog(false); showToast(`Font: ${fs.label}`); }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{fs.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Aa Bb Cc — The quick brown fox jumps over the lazy dog.</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
