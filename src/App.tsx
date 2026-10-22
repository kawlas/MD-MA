import { useState, useRef, useCallback, useMemo, useEffect, useLayoutEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Toolbar from "@/components/Toolbar";
import CodeEditor from "@/components/CodeEditor";
import Preview from "@/components/Preview";
import TableOfContents from "@/components/TableOfContents";
import StatusBar from "@/components/StatusBar";
import CommandPalette from "@/components/CommandPalette";
import SettingsDialog from "@/components/SettingsDialog";
import {
  checkStorage,
  safeGetItem,
  safeSetItem,
  getStorageError,
  getStorageErrorKey,
  retryStorage,
  type StorageError,
} from "@/utils/storage";
import {
  type ViewMode,
  type ThemeName,
  type EffectiveTheme,
  type ThemeVars,
  type FontSet,
  type Block,
  THEMES,
  THEME_LIST,
  FONT_SETS,
  SAMPLE_MARKDOWN,
  getEffectiveTheme,
  extractToc,
  stripMarkdown,
  isTxt,
  getDropFileType,
  parseBlocks,
} from "@/types";
import { useT } from "@/i18n";

function App() {
  const _t = useT();
  const [markdown, setMarkdown] = useState(() => {
    const saved = safeGetItem("md-editor-content");
    return saved || SAMPLE_MARKDOWN;
  });
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [theme, setTheme] = useState(() => {
    const saved = safeGetItem("md-editor-theme");
    return saved || "system";
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [customThemes, setCustomThemes] = useState<Record<string, ThemeVars>>(() => {
    const saved = safeGetItem("md-editor-custom-themes");
    if (!saved) return {};
    try {
      return JSON.parse(saved) as Record<string, ThemeVars>;
    } catch {
      return {};
    }
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSet, setFontSet] = useState<FontSet>(() => {
    const saved = safeGetItem("md-editor-font-set");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Stare preferencje trzymają tylko `label`; nowe — `id` + `label`.
        return (
          FONT_SETS.find((f) => f.id === parsed.id) || FONT_SETS.find((f) => f.label === parsed.label) || FONT_SETS[0]
        );
      } catch {
        /* ignore parse errors */
      }
    }
    return FONT_SETS.find((f) => f.label === "New York") || FONT_SETS[0];
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [themeEditorName, setThemeEditorName] = useState("");
  const [themeEditorJson, setThemeEditorJson] = useState("");
  const [showToc, setShowToc] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [splitRatio, setSplitRatio] = useState(() => {
    const saved = safeGetItem("md-editor-split-ratio");
    return saved ? Number(saved) || 0.5 : 0.5;
  });
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Frontend-side document identity binding: the authorized native path for
  // the current document. Reset on New/file-input/drop so handleSave never
  // writes to a stale path even if clear_current_doc races or fails.
  const [nativeDocPath, setNativeDocPath] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [pendingAction, setPendingAction] = useState<"new" | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    const saved = safeGetItem("md-editor-font-size-delta");
    return saved ? Number(saved) || 0 : 0;
  });
  const [lineHeightDelta, setLineHeightDelta] = useState(() => {
    const saved = safeGetItem("md-editor-line-height-delta");
    return saved ? Number(saved) || 0 : 0;
  });

  // Storage health — synced with the storage module singleton.
  // When non-null a persistent notice is shown with a Retry button.
  const [storageError, setStorageError] = useState<StorageError | null>(() => getStorageError());
  const setStorageErrorRef = useRef(setStorageError);
  useEffect(() => {
    setStorageErrorRef.current = setStorageError;
  }, [setStorageError]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  // ── Scroll sync ──────────────────────────────────────────────
  // Single mutex: when we programmatically set scrollTop, we record
  // a timestamp + 50ms. Any scroll event from the other pane within
  // that window is ignored (avoids feedback loops).
  const scrollLockUntilRef = useRef(0);
  const scrollRafRef = useRef<number | undefined>(undefined);

  // Block map for scroll sync — kept in sync with previewMarkdown
  const previewBlocksRef = useRef<Block[]>([]);
  const previewBlocks = useMemo(() => parseBlocks(previewMarkdown), [previewMarkdown]);
  // Mirror the parsed blocks into the ref after commit so it always matches
  // the rendered preview DOM (refs must not be written during render).
  useLayoutEffect(() => {
    previewBlocksRef.current = previewBlocks;
  }, [previewBlocks]);
  // ── End scroll sync ──────────────────────────────────────────

  // ── Storage health check on mount ──────────────────────────
  useEffect(() => {
    checkStorage();
    setStorageErrorRef.current(getStorageError());
  }, []);

  // ── Persist helper that surfaces failures to the React state ─
  // On failure, safeSetItem updates the module singleton; we mirror it
  // into React state so the persistent notice re-renders.
  const persist = useCallback((key: string, value: string) => {
    if (!safeSetItem(key, value)) {
      setStorageErrorRef.current(getStorageError());
    }
  }, []);

  // Persist markdown to localStorage (debounced 500ms)
  const latestMdRef = useRef(markdown);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    latestMdRef.current = markdown;
  });
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persist("md-editor-content", latestMdRef.current);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [markdown, persist]);

  // Persist theme
  useEffect(() => {
    persist("md-editor-theme", theme);
  }, [theme, persist]);

  // Persist custom themes
  useEffect(() => {
    persist("md-editor-custom-themes", JSON.stringify(customThemes));
  }, [customThemes, persist]);

  // Persist font set
  useEffect(() => {
    persist("md-editor-font-set", JSON.stringify(fontSet));
  }, [fontSet, persist]);

  // Persist split ratio
  useEffect(() => {
    persist("md-editor-split-ratio", String(splitRatio));
  }, [splitRatio, persist]);

  // Apply font set + deltas as CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const bodySize = Math.max(10, fontSet.bodySize + fontSizeDelta);
    const codeSize = Math.max(9, fontSet.codeSize + fontSizeDelta * 0.8);
    const lineH = Math.max(1.2, fontSet.lineHeight + lineHeightDelta * 0.1);
    root.style.setProperty("--font-body", fontSet.body);
    root.style.setProperty("--font-text", fontSet.body);
    root.style.setProperty("--font-code", fontSet.code);
    root.style.setProperty("--font-size-body", `${bodySize}px`);
    root.style.setProperty("--font-size-text", `${bodySize}px`);
    root.style.setProperty("--font-size-code", `${codeSize}px`);
    root.style.setProperty("--line-height-body", `${lineH}`);
    root.style.setProperty("--line-height-text", `${lineH}`);
    root.style.setProperty("--line-height-code", `${lineH}`);
  }, [fontSet, fontSizeDelta, lineHeightDelta]);

  // Persist font/line deltas
  useEffect(() => {
    persist("md-editor-font-size-delta", String(fontSizeDelta));
  }, [fontSizeDelta, persist]);
  useEffect(() => {
    persist("md-editor-line-height-delta", String(lineHeightDelta));
  }, [lineHeightDelta, persist]);

  // Cleanup timers / RAFs on unmount
  useEffect(
    () => () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    },
    [],
  );

  // Compute effective theme and CSS variables
  const effectiveTheme: EffectiveTheme = useMemo(
    () => getEffectiveTheme(theme as ThemeName, systemPrefersDark),
    [theme, systemPrefersDark],
  );
  const themeVars = useMemo(() => {
    const vars = customThemes[theme] || THEMES[effectiveTheme];
    // Fill in derived control roles that older and custom themes may not carry:
    // --border-control (control boundaries >= 3:1) and --accent-contrast (for light accents).
    return {
      ...vars,
      "--border-control": vars["--border-control"] ?? vars["--border"] ?? "transparent",
      "--accent-contrast": vars["--accent-contrast"] ?? "#ffffff",
    };
  }, [theme, customThemes, effectiveTheme]);
  const tocItems = useMemo(() => extractToc(markdown), [markdown]);

  // Listen for system theme changes (only while 'system' is selected)
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemPrefersDark(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastExiting(false);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastExiting(true);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        setToastExiting(false);
        toastTimeoutRef.current = undefined;
      }, 300);
    }, 2000);
  }, []);

  // ── Retry storage after a failure; re-persist current data on success ─
  const handleRetryStorage = useCallback(() => {
    if (retryStorage()) {
      setStorageError(null);
      showToast(_t("app.storage.error.retry_success"));
      // Storage is available again — re-persist everything from React state
      safeSetItem("md-editor-content", latestMdRef.current);
      safeSetItem("md-editor-theme", theme);
      safeSetItem("md-editor-custom-themes", JSON.stringify(customThemes));
      safeSetItem("md-editor-font-set", JSON.stringify(fontSet));
      safeSetItem("md-editor-split-ratio", String(splitRatio));
      safeSetItem("md-editor-font-size-delta", String(fontSizeDelta));
      safeSetItem("md-editor-line-height-delta", String(lineHeightDelta));
    } else {
      setStorageError(getStorageError());
      showToast(_t("app.storage.error.retry_failed"));
    }
  }, [showToast, _t, latestMdRef, theme, customThemes, fontSet, splitRatio, fontSizeDelta, lineHeightDelta]);

  // File operations
  const handleOpenFile = useCallback(async () => {
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      try {
        const result = await invoke<{ path: string; filename: string; content: string | null }>("open_file");
        const content = result.content ?? "";
        setNativeDocPath(result.path); // Authorize this path for subsequent save_file
        setMarkdown(content);
        setPreviewMarkdown(content);
        setFileName(result.filename);
        setIsModified(false);
        showToast(`${_t("app.toast.opened")}: ${result.filename}`);
      } catch {
        showToast(_t("app.toast.open_cancelled"));
      }
    } else {
      fileInputRef.current?.click();
    }
  }, [showToast, _t]);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.name.toLowerCase().endsWith(".pdf")) {
        showToast(_t("app.toast.pdf_not_supported"));
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        // Invalidate backend document identity — this is a replacement document
        // imported via web file input, not a native-dialog open.
        if (typeof window !== "undefined" && "__TAURI__" in window) {
          void invoke("clear_current_doc").catch(() => {});
        }
        setNativeDocPath(null);
        setMarkdown(content);
        setPreviewMarkdown(content);
        setFileName(file.name);
        setIsModified(false);
        showToast(`${_t("app.toast.opened")}: ${file.name}`);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [showToast, _t]);

  const doNewFile = useCallback(() => {
    // Invalidate any backend-authorized document path — a new document
    // must not write back to the previously opened file.
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      void invoke("clear_current_doc").catch(() => {});
    }
    setNativeDocPath(null);
    setMarkdown("");
    setPreviewMarkdown("");
    setFileName(null);
    setIsModified(false);
    setPendingAction(null);
    showToast(_t("app.toast.new_document"));
  }, [showToast, _t]);

  const handleNewFile = useCallback(() => {
    if (isModified || markdown.length > 0) {
      setPendingAction("new");
      return;
    }
    doNewFile();
  }, [isModified, markdown, doNewFile]);

  // Save As — always shows a dialog (native or web download)
  const handleSaveAs = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window !== "undefined" && "__TAURI__" in window) {
        // Native Tauri save dialog — backend writes atomically and authorizes the path
        const result = await invoke<{ path: string; filename: string; content: string | null }>("save_file_as", {
          content: markdown,
        });
        setNativeDocPath(result.path); // Authorize this path for subsequent save_file
        setFileName(result.filename);
        setIsModified(false);
        showToast(`${_t("app.toast.saved")}: ${result.filename}`);
        return true;
      } else {
        // Web download fallback (existing implementation) — now uses isTxt from types
        const suggested = fileName || "document.md";
        const ext = fileName?.endsWith(".txt") ? ".txt" : ".md";
        const mime = ext === ".txt" ? "text/plain" : "text/markdown";
        const text = isTxt(suggested) ? stripMarkdown(markdown) : markdown;
        const blob = new Blob([text], { type: `${mime};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = suggested;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsModified(false);
        showToast(_t("app.toast.downloaded"));
        return true;
      }
    } catch {
      showToast(_t("app.toast.save_cancelled"));
      return false;
    }
  }, [markdown, fileName, isTxt, stripMarkdown, showToast, _t]);

  // Save to the current (authorized) document path. If none is open, fall
  // back to Save As. The nativeDocPath binding ensures we never write to a
  // stale backend path after New/import/drop — even if clear_current_doc races.
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (typeof window !== "undefined" && "__TAURI__" in window && nativeDocPath) {
      try {
        const result = await invoke<{ path: string; filename: string; content: string | null }>("save_file", {
          content: markdown,
        });
        setFileName(result.filename);
        setIsModified(false);
        showToast(`${_t("app.toast.saved")}: ${result.filename}`);
        return true;
      } catch {
        // No current document open or save backend error — fall back to Save As dialog
        return handleSaveAs();
      }
    } else {
      // Web: no backend path, always fall back to download
      return handleSaveAs();
    }
  }, [markdown, nativeDocPath, handleSaveAs, showToast, _t]);

  const handleConfirmDiscard = useCallback(() => {
    if (pendingAction === "new") doNewFile();
    else setPendingAction(null);
  }, [pendingAction, doNewFile]);

  const handleConfirmCancel = useCallback(() => {
    setPendingAction(null);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    const saved = await handleSave();
    if (saved === false) {
      // handleSave may have fallen back to SaveAs — if that also failed or was cancelled, abort
      if (!fileName && pendingAction === "new") {
        // SaveAs was shown and cancelled — just cancel the pending action
        setPendingAction(null);
      }
      return;
    }
    if (saved && pendingAction === "new") {
      doNewFile();
    }
  }, [handleSave, pendingAction, doNewFile, fileName]);

  // Export PDF via print
  const handleExportPdf = useCallback(() => {
    showToast(_t("app.toast.printing"));
    setTimeout(() => window.print(), 100);
  }, [showToast]);

  // Theme management
  const handleOpenThemeDialog = useCallback(() => {
    setThemeEditorName("");
    setThemeEditorJson("");
    setShowThemeDialog(true);
  }, []);

  const handleSaveCustomTheme = useCallback(() => {
    const name = themeEditorName.trim();
    if (!name) {
      showToast(_t("app.toast.theme_name_required"));
      return;
    }
    try {
      const vars = JSON.parse(themeEditorJson) as Record<string, string>;
      if (typeof vars !== "object" || vars === null || !vars["--bg-primary"]) {
        showToast(_t("app.toast.theme_bg_required"));
        return;
      }
      setCustomThemes((prev) => ({ ...prev, [name]: vars }));
      setTheme(name);
      setShowThemeDialog(false);
      showToast(`${_t("app.toast.theme_saved")}: ${name}`);
    } catch {
      showToast(_t("app.toast.theme_json_invalid"));
    }
  }, [themeEditorName, themeEditorJson, showToast, setCustomThemes, setTheme]);

  const handleDeleteCustomTheme = useCallback(
    (name: string) => {
      setCustomThemes((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (theme === name) setTheme("system");
      showToast(`${_t("app.toast.theme_deleted")}: ${name}`);
    },
    [theme, showToast, setTheme],
  );

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
    requestAnimationFrame(() => {
      isUndoingRef.current = false;
    });
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
    requestAnimationFrame(() => {
      isUndoingRef.current = false;
    });
  }, [historyIndex]);

  // Font size adjustments
  const handleIncreaseFontSize = useCallback(() => setFontSizeDelta((d) => Math.min(d + 1, 12)), []);
  const handleDecreaseFontSize = useCallback(() => setFontSizeDelta((d) => Math.max(d - 1, -8)), []);
  const handleIncreaseLineHeight = useCallback(() => setLineHeightDelta((d) => Math.min(d + 1, 8)), []);
  const handleDecreaseLineHeight = useCallback(() => setLineHeightDelta((d) => Math.max(d - 1, -6)), []);
  const handleResetFont = useCallback(() => {
    setFontSet(FONT_SETS[0]);
    setFontSizeDelta(0);
    setLineHeightDelta(0);
    showToast(_t("app.toast.font_reset"));
  }, [showToast]);

  const handleOpenSettings = useCallback(() => {
    setShowSettingsPanel(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettingsPanel(false);
  }, []);

  // Copy rendered
  const handleCopyRendered = useCallback(async () => {
    const previewEl = previewRef.current;
    if (!previewEl) {
      showToast(_t("app.toast.preview_needed"));
      return;
    }

    // The scrolling pane wraps the measured content box — copy the content only
    const contentEl = (previewEl.querySelector(".md-preview") ?? previewEl) as HTMLElement;

    try {
      const html = contentEl.innerHTML;
      const text = contentEl.innerText;
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      showToast(_t("app.toast.copied_rich"));
    } catch {
      try {
        await navigator.clipboard.writeText(previewEl.innerText);
        showToast(_t("app.toast.copied_plain"));
      } catch {
        showToast(_t("app.toast.copy_failed"));
      }
    }
  }, [showToast]);

  // Drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const fileType = getDropFileType(file.name, file.type);

      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const md = `![${file.name}](${dataUrl})`;
          const editor = editorRef.current;
          if (editor) {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const newValue = markdown.slice(0, start) + md + markdown.slice(end);
            setMarkdown(newValue);
            setPreviewMarkdown(newValue);
            setIsModified(true);
            requestAnimationFrame(() => {
              const cursor = start + md.length;
              editor.selectionStart = editor.selectionEnd = cursor;
              editor.focus();
            });
          } else {
            setMarkdown((prev) => prev + "\n" + md);
            setPreviewMarkdown((prev) => prev + "\n" + md);
            setIsModified(true);
          }
          showToast(`${_t("app.toast.image_added")}: ${file.name}`);
        };
        reader.readAsDataURL(file);
        return;
      }

      if (fileType !== "text") {
        showToast(_t("app.toast.drop_hint"));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        // Invalidate backend document identity — dropped file replaces the document
        if (typeof window !== "undefined" && "__TAURI__" in window) {
          void invoke("clear_current_doc").catch(() => {});
        }
        setNativeDocPath(null);
        setMarkdown(content);
        setPreviewMarkdown(content);
        setFileName(file.name);
        setIsModified(false);
        showToast(`${_t("app.toast.opened")}: ${file.name}`);
      };
      reader.readAsText(file);
    },
    [markdown, showToast, _t],
  );

  // ── Scroll sync logic ────────────────────────────────────────

  const getEditorLineHeight = useCallback((editor: HTMLTextAreaElement): number => {
    const lh = Number.parseFloat(window.getComputedStyle(editor).lineHeight);
    return Number.isFinite(lh) && lh > 0 ? lh : 22;
  }, []);

  const applyRatioSync = useCallback(
    (source: { scrollTop: number; scrollHeight: number; clientHeight: number }, target: HTMLElement): number | null => {
      const maxSource = source.scrollHeight - source.clientHeight;
      const maxTarget = target.scrollHeight - target.clientHeight;
      if (maxSource <= 0 || maxTarget <= 0) return null;
      return (source.scrollTop / maxSource) * maxTarget;
    },
    [],
  );

  // Core sync: source → target using block map (or ratio fallback)
  const syncScroll = useCallback(
    (source: "editor" | "preview") => {
      if (Date.now() < scrollLockUntilRef.current) return;

      const editor = editorRef.current;
      const preview = previewRef.current;
      if (!editor || !preview) return;

      if (source === "editor") {
        const lineHeight = getEditorLineHeight(editor);
        const topLine = Math.max(0, Math.floor(editor.scrollTop / lineHeight));

        // Update active heading for TOC
        const activeHeading = [...tocItems].reverse().find((item) => item.line <= topLine);
        if (activeHeading?.id !== activeHeadingId) {
          setActiveHeadingId(activeHeading?.id);
        }

        if (viewMode !== "split") return;

        const blocks = previewBlocksRef.current;
        if (blocks.length === 0) return;

        const blockIdx = blocks.findIndex((b) => topLine >= b.startLine && topLine <= b.endLine);
        if (blockIdx < 0) {
          const target = applyRatioSync(editor, preview);
          if (target !== null) {
            scrollLockUntilRef.current = Date.now() + 50;
            preview.scrollTop = target;
          }
          return;
        }

        const block = blocks[blockIdx];
        const el = preview.querySelector<HTMLElement>(`[data-block-id="${block.id}"]`);
        if (!el) {
          const target = applyRatioSync(editor, preview);
          if (target !== null) {
            scrollLockUntilRef.current = Date.now() + 50;
            preview.scrollTop = target;
          }
          return;
        }

        const linesInto = topLine - block.startLine;
        const span = Math.max(1, block.endLine - block.startLine + 1);
        let targetTop = el.offsetTop;
        const nextBlock = blocks[blockIdx + 1];
        if (nextBlock) {
          const nextEl = preview.querySelector<HTMLElement>(`[data-block-id="${nextBlock.id}"]`);
          if (nextEl) {
            targetTop += (linesInto / span) * (nextEl.offsetTop - el.offsetTop);
          }
        } else if (el.offsetHeight > 0) {
          targetTop += Math.min((linesInto / span) * el.offsetHeight, el.offsetHeight - preview.clientHeight / 3);
        }
        scrollLockUntilRef.current = Date.now() + 50;
        preview.scrollTop = targetTop;
      } else {
        // source === 'preview'
        const blockElements = Array.from(preview.querySelectorAll<HTMLElement>("[data-block-id]"));
        if (blockElements.length === 0) return;

        const top = preview.scrollTop + 1;
        let activeEl: HTMLElement = blockElements[0];
        for (const el of blockElements) {
          if (el.offsetTop <= top) activeEl = el;
          else break;
        }

        const startLine = Number(activeEl.dataset.sourceStartLine) || 0;

        // Update active heading for TOC
        const activeHeading = [...tocItems].reverse().find((item) => item.line <= startLine);
        if (activeHeading?.id !== activeHeadingId) {
          setActiveHeadingId(activeHeading?.id);
        }

        if (viewMode !== "split") return;

        const lineHeight = getEditorLineHeight(editor);
        const endLineRaw = activeEl.dataset.sourceEndLine;
        const endLine = endLineRaw ? Number(endLineRaw) : startLine;
        const blockLineSpan = Math.max(1, endLine - startLine + 1);
        const blockOffset = top - activeEl.offsetTop;
        const blockHeight = activeEl.offsetHeight;
        let targetLine: number;
        if (blockHeight > 0) {
          targetLine = startLine + Math.min(Math.round((blockOffset / blockHeight) * blockLineSpan), blockLineSpan - 1);
        } else {
          targetLine = startLine;
        }
        scrollLockUntilRef.current = Date.now() + 50;
        editor.scrollTop = targetLine * lineHeight;
      }
    },
    [viewMode, tocItems, getEditorLineHeight, applyRatioSync, activeHeadingId],
  );

  // RAF-throttled scroll handlers (stable callbacks, always up-to-date via ref)
  const syncScrollRef = useRef<typeof syncScroll>(syncScroll);
  useEffect(() => {
    syncScrollRef.current = syncScroll;
  });

  const onEditorScroll = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = undefined;
      syncScrollRef.current("editor");
    });
  }, []);

  const onPreviewScroll = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = undefined;
      syncScrollRef.current("preview");
    });
  }, []);

  // After previewMarkdown updates, re-sync preview scroll to editor position
  useEffect(() => {
    if (viewMode !== "split") return;
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    // Wait for DOM to settle after React re-render
    requestAnimationFrame(() => {
      if (Date.now() < scrollLockUntilRef.current) return;
      const lh = getEditorLineHeight(editor);
      const topLine = Math.max(0, Math.floor(editor.scrollTop / lh));
      const blocks = previewBlocksRef.current;
      const blockIdx = blocks.findIndex((b: Block) => topLine >= b.startLine && topLine <= b.endLine);
      if (blockIdx >= 0) {
        const pb = blocks[blockIdx];
        const el = preview.querySelector<HTMLElement>(`[data-block-id="${pb.id}"]`);
        if (el) {
          const linesInto = topLine - pb.startLine;
          const span = Math.max(1, pb.endLine - pb.startLine + 1);
          let targetTop = el.offsetTop;
          const next = blocks[blockIdx + 1];
          if (next) {
            const nextEl = preview.querySelector<HTMLElement>(`[data-block-id="${next.id}"]`);
            if (nextEl) targetTop += (linesInto / span) * (nextEl.offsetTop - el.offsetTop);
          } else if (el.offsetHeight > 0) {
            targetTop += Math.min((linesInto / span) * el.offsetHeight, el.offsetHeight - preview.clientHeight / 2);
          }
          scrollLockUntilRef.current = Date.now() + 50;
          preview.scrollTop = targetTop;
          return;
        }
      }
      // Fallback ratio
      const maxE = editor.scrollHeight - editor.clientHeight;
      const maxP = preview.scrollHeight - preview.clientHeight;
      if (maxE > 0 && maxP > 0) {
        scrollLockUntilRef.current = Date.now() + 50;
        preview.scrollTop = (editor.scrollTop / maxE) * maxP;
      }
    });
  }, [previewMarkdown, viewMode, getEditorLineHeight]);

  // ── End scroll sync ──────────────────────────────────────────

  // Split resize drag handler
  const handleSplitMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = splitContainerRef.current;
      if (!container) return;
      const startX = e.clientX;
      const startRatio = splitRatio;
      const containerWidth = container.offsetWidth;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const ratio = Math.max(0.15, Math.min(0.85, startRatio + dx / containerWidth));
        setSplitRatio(ratio);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [splitRatio],
  );

  // Command palette commands
  const paletteCommands = useMemo<
    { id: string; label: string; category: string; shortcut?: string; action: () => void }[]
  >(
    () => [
      {
        id: "view-code",
        label: _t("palette.code_view"),
        category: _t("palette.view"),
        shortcut: "⌘1",
        action: () => setViewMode("code"),
      },
      {
        id: "view-preview",
        label: _t("palette.preview_view"),
        category: _t("palette.view"),
        shortcut: "⌘2",
        action: () => setViewMode("preview"),
      },
      {
        id: "view-split",
        label: _t("palette.split_view"),
        category: _t("palette.view"),
        shortcut: "⌘3",
        action: () => setViewMode("split"),
      },
      {
        id: "toggle-focus",
        label: _t("palette.toggle_focus"),
        category: _t("palette.view"),
        shortcut: "⌘⇧F",
        action: () => setIsFocusMode((p) => !p),
      },
      {
        id: "toggle-outline",
        label: _t("palette.toggle_outline"),
        category: _t("palette.view"),
        shortcut: "⌘⇧T",
        action: () => setShowToc((p) => !p),
      },
      {
        id: "new-file",
        label: _t("palette.new_file"),
        category: _t("palette.file"),
        shortcut: "⌘N",
        action: handleNewFile,
      },
      {
        id: "open-file",
        label: _t("palette.open_file"),
        category: _t("palette.file"),
        shortcut: "⌘O",
        action: handleOpenFile,
      },
      { id: "save", label: _t("palette.save"), category: _t("palette.file"), shortcut: "⌘S", action: handleSave },
      {
        id: "save-as",
        label: _t("palette.save_as"),
        category: _t("palette.file"),
        shortcut: "⌘⇧S",
        action: handleSaveAs,
      },
      {
        id: "export-pdf",
        label: _t("palette.export_pdf"),
        category: _t("palette.export"),
        shortcut: "⌘⇧P",
        action: handleExportPdf,
      },
      {
        id: "copy-rtf",
        label: _t("palette.copy_rtf"),
        category: _t("palette.export"),
        shortcut: "⌘⇧C",
        action: handleCopyRendered,
      },
      { id: "undo", label: _t("palette.undo"), category: _t("palette.edit"), shortcut: "⌘Z", action: handleUndo },
      { id: "redo", label: _t("palette.redo"), category: _t("palette.edit"), shortcut: "⌘⇧Z", action: handleRedo },
      { id: "font-inc", label: _t("palette.font_inc"), category: _t("palette.font"), action: handleIncreaseFontSize },
      { id: "font-dec", label: _t("palette.font_dec"), category: _t("palette.font"), action: handleDecreaseFontSize },
      { id: "font-reset", label: _t("palette.font_reset"), category: _t("palette.font"), action: handleResetFont },
      { id: "line-inc", label: _t("palette.line_inc"), category: _t("palette.font"), action: handleIncreaseLineHeight },
      { id: "line-dec", label: _t("palette.line_dec"), category: _t("palette.font"), action: handleDecreaseLineHeight },
      { id: "settings", label: _t("palette.settings"), category: _t("palette.app"), action: handleOpenSettings },
    ],
    [
      handleNewFile,
      handleOpenFile,
      handleSave,
      handleSaveAs,
      handleExportPdf,
      handleCopyRendered,
      handleUndo,
      handleRedo,
      handleIncreaseFontSize,
      handleDecreaseFontSize,
      handleResetFont,
      handleIncreaseLineHeight,
      handleDecreaseLineHeight,
      handleOpenSettings,
    ],
  );

  // Push current markdown to history stack (debounced)
  const pushHistory = useCallback(
    (value: string) => {
      const hist = historyRef.current;
      // Trim any future entries (when user undid and then typed something new)
      hist.length = historyIndex + 1;
      hist.push(value);
      if (hist.length > 200) hist.shift();
      setHistoryIndex(hist.length - 1);
      setHistoryLen(hist.length);
    },
    [historyIndex],
  );

  // Track modifications + push to history (debounced per keystroke)
  const handleChange = useCallback(
    (value: string) => {
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
    },
    [pushHistory],
  );

  // Image paste — insert as base64 markdown
  const handleImagePaste = useCallback(
    (dataUrl: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const alt = "pasted-image";
      const md = `![${alt}](${dataUrl})`;
      const newValue = markdown.slice(0, start) + md + markdown.slice(end);
      setMarkdown(newValue);
      setPreviewMarkdown(newValue);
      setIsModified(true);
      showToast(_t("app.toast.image_pasted"));
      requestAnimationFrame(() => {
        const cursor = start + md.length;
        editor.selectionStart = editor.selectionEnd = cursor;
        editor.focus();
      });
    },
    [markdown, showToast],
  );

  // Tauri native menu event listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        unlisten = await listen<string>("menu-event", (event) => {
          const action = event.payload;
          switch (action) {
            case "new_file":
              handleNewFile();
              break;
            case "open_file":
              handleOpenFile();
              break;
            case "save":
              handleSave();
              break;
            case "save_as":
              handleSaveAs();
              break;
            case "export_pdf":
              handleExportPdf();
              break;
            case "copy_rtf":
              handleCopyRendered();
              break;
            case "undo":
              handleUndo();
              break;
            case "redo":
              handleRedo();
              break;
            case "toggle_toc":
              setShowToc((p) => !p);
              break;
            case "toggle_focus":
              setIsFocusMode((p) => !p);
              break;
            case "close_window":
              getCurrentWindow().close();
              break;
            case "about":
              showToast(_t("app.about"));
              break;
            case "zoom":
              getCurrentWindow().toggleMaximize();
              break;
            case "hide_others":
              showToast(_t("app.toast.hide_others"));
              break;
            case "show_all":
              showToast(_t("app.toast.show_all"));
              break;
          }
        });
      } catch {
        // Not running inside Tauri — ignore
      }
    })();
    return () => {
      unlisten?.();
    };
  }, [handleSave, handleSaveAs, handleOpenFile, handleNewFile, handleCopyRendered, handleExportPdf, handleUndo, handleRedo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }
      if (mod && e.shiftKey && key === "s") {
        e.preventDefault();
        handleSaveAs();
        return;
      }
      if (mod && key === "o") {
        e.preventDefault();
        handleOpenFile();
        return;
      }
      if (mod && key === "n") {
        e.preventDefault();
        handleNewFile();
        return;
      }
      if (mod && e.shiftKey && key === "p") {
        e.preventDefault();
        handleExportPdf();
        return;
      }
      if (mod && e.shiftKey && key === "z") {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (mod && !e.shiftKey && key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (mod && !e.shiftKey && key === "k") {
        e.preventDefault();
        setShowCommandPalette((p) => !p);
        return;
      }
      if (mod && e.shiftKey && key === "c") {
        e.preventDefault();
        handleCopyRendered();
        return;
      }
      if (key === "f5") {
        e.preventDefault();
        setTheme((prev) => {
          const builtin = ["system", ...THEME_LIST];
          const idx = builtin.indexOf(prev);
          return builtin[(idx + 1) % builtin.length];
        });
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, handleSaveAs, handleOpenFile, handleNewFile, handleCopyRendered, handleExportPdf, handleUndo, handleRedo]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{
        ...themeVars,
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
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
        style={{ display: "none" }}
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
        onSave={handleSave}
        onExportPdf={handleExportPdf}
        onNewFile={handleNewFile}
        showToc={showToc}
        setShowToc={setShowToc}
        fileName={fileName}
        isModified={isModified}
        isFocusMode={isFocusMode}
        onToggleFocus={() => setIsFocusMode((p) => !p)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenSettings={handleOpenSettings}
      />

      {/* Persistent storage notice — appears when localStorage fails, stays
          until the user retries successfully. Editor data is safe in
          React state; the notice reminds the user to Download their work. */}
      {storageError && (
        <div className="storage-notice">
          <span className="storage-notice-msg">{_t(getStorageErrorKey())}</span>
          <button className="storage-notice-btn storage-notice-retry" onClick={handleRetryStorage}>
            {_t("app.storage.error.retry")}
          </button>
          <button className="storage-notice-btn storage-notice-download" onClick={handleSaveAs}>
            {_t("toolbar.save")}
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        className={`app-main view-${viewMode} flex flex-1 overflow-hidden ${isFocusMode ? "focus-mode-active" : ""}`}
      >
        {/* Focus mode exit button */}
        {isFocusMode && (
          <button className="focus-exit-btn" onClick={() => setIsFocusMode(false)}>
            {_t("focus.exit")}
          </button>
        )}

        {/* TOC Sidebar */}
        {showToc && <TableOfContents markdown={markdown} activeId={activeHeadingId} />}

        {/* Editor / Preview / Split */}
        {viewMode === "code" && (
          <div className="editor-pane flex-1 overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
            <CodeEditor
              ref={editorRef}
              value={markdown}
              onChange={handleChange}
              onScroll={onEditorScroll}
              onImagePaste={handleImagePaste}
            />
          </div>
        )}

        {viewMode === "preview" && (
          <div className="preview-pane flex-1 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
            <Preview ref={previewRef} markdown={previewMarkdown} onScroll={onPreviewScroll} />
          </div>
        )}

        {viewMode === "split" && (
          <div ref={splitContainerRef} className="flex flex-1 overflow-hidden">
            <div
              className="editor-pane overflow-hidden"
              style={{ flex: `0 0 ${splitRatio * 100}%`, background: "var(--bg-secondary)" }}
            >
              <CodeEditor
                ref={editorRef}
                value={markdown}
                onChange={handleChange}
                onScroll={onEditorScroll}
                onImagePaste={handleImagePaste}
              />
            </div>
            <div
              className="split-divider"
              onMouseDown={handleSplitMouseDown}
              style={{
                cursor: "col-resize",
                width: 6,
                flexShrink: 0,
                background: "var(--border)",
                position: "relative",
              }}
            />
            <div
              className="preview-pane overflow-hidden"
              style={{ flex: `0 0 ${(1 - splitRatio) * 100}%`, background: "var(--bg-primary)" }}
            >
              <Preview ref={previewRef} markdown={previewMarkdown} onScroll={onPreviewScroll} />
            </div>
          </div>
        )}
      </div>

      {/* Status bar (hidden in focus mode) */}
      {!isFocusMode && <StatusBar markdown={markdown} fileName={fileName} />}

      {/* Command palette */}
      {showCommandPalette && <CommandPalette commands={paletteCommands} onClose={() => setShowCommandPalette(false)} />}

      {/* Drag overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
            <div>{_t("drag.drop_hint")}</div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast ${toastExiting ? "toast-out" : ""}`}>{toast}</div>}

      {/* Theme dialog */}
      {showThemeDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowThemeDialog(false)}
        >
          <div
            className="rounded-lg shadow-md w-full max-w-lg border border-[var(--border)]"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                {_t("theme.title")}
              </h2>
              <button className="toolbar-btn" onClick={() => setShowThemeDialog(false)} style={{ padding: "4px 8px" }}>
                ✕
              </button>
            </div>

            {/* Existing custom themes */}
            <div className="mb-4 space-y-2" style={{ maxHeight: 200, overflowY: "auto" }}>
              {Object.keys(customThemes).length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{_t("theme.no_themes")}</p>
              )}
              {Object.entries(customThemes).map(([name]) => (
                <div
                  key={name}
                  className="flex items-center justify-between"
                  style={{ padding: "6px 8px", borderRadius: 6, background: "var(--bg-secondary)" }}
                >
                  <button
                    className="font-medium"
                    style={{
                      fontSize: 14,
                      color: "var(--text-primary)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setTheme(name);
                      setShowThemeDialog(false);
                    }}
                  >
                    {name}
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => handleDeleteCustomTheme(name)}
                    style={{ padding: "2px 8px", fontSize: 12, color: "var(--callout-caution-border, #ef4444)" }}
                  >
                    {_t("theme.delete")}
                  </button>
                </div>
              ))}
            </div>

            {/* New theme form */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <input
                className="w-full mb-2"
                placeholder={_t("theme.name_placeholder")}
                value={themeEditorName}
                onChange={(e) => setThemeEditorName(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <textarea
                className="w-full mb-3 font-mono"
                rows={6}
                placeholder={_t("theme.json_placeholder")}
                value={themeEditorJson}
                onChange={(e) => setThemeEditorJson(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "monospace",
                }}
              />
              <button
                className="toolbar-btn"
                onClick={handleSaveCustomTheme}
                style={{ background: "var(--accent)", color: "var(--accent-contrast)", border: "none" }}
              >
                {_t("theme.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes confirm dialog */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={handleConfirmCancel}
        >
          <div
            className="rounded-lg shadow-md w-full max-w-sm border border-[var(--border)]"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              {_t("app.unsaved.title")}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
              {_t("app.unsaved.body")}
            </p>
            <div className="flex gap-2 justify-end">
              <button className="toolbar-btn" onClick={handleConfirmCancel}>
                {_t("app.unsaved.cancel")}
              </button>
              <button
                className="toolbar-btn"
                onClick={handleConfirmDiscard}
                style={{ color: "#ef4444", borderColor: "#ef4444" }}
              >
                {_t("app.unsaved.discard")}
              </button>
              <button
                className="toolbar-btn"
                onClick={handleConfirmSave}
                style={{ background: "var(--accent)", color: "var(--accent-contrast)", border: "none" }}
              >
                {_t("app.unsaved.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <SettingsDialog
          theme={theme}
          setTheme={setTheme}
          customThemes={customThemes}
          fontSet={fontSet}
          setFontSet={setFontSet}
          isFocusMode={isFocusMode}
          setIsFocusMode={setIsFocusMode}
          onClose={handleCloseSettings}
          onOpenCustomThemes={handleOpenThemeDialog}
          showToast={showToast}
          onDecreaseFontSize={handleDecreaseFontSize}
          onIncreaseFontSize={handleIncreaseFontSize}
          onDecreaseLineHeight={handleDecreaseLineHeight}
          onIncreaseLineHeight={handleIncreaseLineHeight}
          onResetFont={handleResetFont}
        />
      )}

      {/* Font dialog */}
      {showFontDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowFontDialog(false)}
        >
          <div
            className="rounded-lg shadow-md w-full max-w-md border border-[var(--border)]"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                {_t("font_sets.title")}
              </h2>
              <button className="toolbar-btn" onClick={() => setShowFontDialog(false)} style={{ padding: "4px 8px" }}>
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {FONT_SETS.map((fs) => (
                <button
                  key={fs.label}
                  className="w-full text-left"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: fontSet.label === fs.label ? "var(--accent)" : "var(--bg-secondary)",
                    color: fontSet.label === fs.label ? "var(--accent-contrast)" : "var(--text-primary)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.15s ease",
                    fontFamily: fs.body,
                  }}
                  onClick={() => {
                    setFontSet(fs);
                    setShowFontDialog(false);
                    showToast(`${_t("app.font")}: ${fs.label}`);
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{fs.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{_t("font_sets.sample")}</div>
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
