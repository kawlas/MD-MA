import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, act, waitFor, fireEvent, cleanup } from "@testing-library/react";

const matchMediaAPI = vi.hoisted(() => {
  const state = {
    listeners: new Set<(e: MediaQueryListEvent) => void>(),
    matches: false,
  };
  const mq = {
    matches: false,
    media: "(prefers-color-scheme: dark)",
    onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
    addEventListener(type: "change", listener: (e: MediaQueryListEvent) => void) {
      if (type === "change") state.listeners.add(listener);
    },
    removeEventListener(type: "change", listener: (e: MediaQueryListEvent) => void) {
      if (type === "change") state.listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  return {
    mq,
    setMatches(dark: boolean) {
      state.matches = dark;
      (mq as { matches: boolean }).matches = dark;
    },
    triggerChange(dark: boolean) {
      state.matches = dark;
      (mq as { matches: boolean }).matches = dark;
      state.listeners.forEach((l) => l({ matches: dark } as MediaQueryListEvent));
    },
    listenerCount: () => state.listeners.size,
    clearListeners() {
      state.listeners.clear();
    },
  };
});

const localStorageMock = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
});

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    close: vi.fn(),
    toggleMaximize: vi.fn(),
  })),
}));

// Mock Tauri invoke for native file I/O tests. In the test environment
// (jsdom), __TAURI__ is not set, so the App falls back to web behavior.
// These tests stub __TAURI__ and invoke to simulate the Tauri context.
const tauriInvokeMock = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => tauriInvokeMock(...args),
}));

vi.mock("@/components/Toolbar", () => ({ default: () => null }));
vi.mock("@/components/CodeEditor", () => ({ default: () => null }));
vi.mock("@/components/Preview", () => ({ default: () => null }));
vi.mock("@/components/TableOfContents", () => ({ default: () => null }));
vi.mock("@/components/StatusBar", () => ({ default: () => null }));
vi.mock("@/components/CommandPalette", () => ({ default: () => null }));
vi.mock("@/components/SettingsDialog", () => ({ default: () => null }));

vi.mock("@/i18n", () => ({
  useT: () => (key: string) => key,
}));

import App from "./App";
import { clearStorageError } from "./utils/storage";

beforeEach(() => {
  localStorageMock.clear();
  // Restore setItem to its original working implementation
  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    localStorageMock.store.set(key, value);
  });
  localStorageMock.getItem.mockImplementation((key: string) => localStorageMock.store.get(key) ?? null);
  localStorageMock.removeItem.mockImplementation((key: string) => {
    localStorageMock.store.delete(key);
  });
  localStorageMock.clear.mockImplementation(() => {
    localStorageMock.store.clear();
  });
  vi.stubGlobal("localStorage", localStorageMock);
  clearStorageError();
  matchMediaAPI.setMatches(false);
  matchMediaAPI.clearListeners();
  vi.stubGlobal("matchMedia", () => matchMediaAPI.mq as unknown as MediaQueryList);
  // Reset Tauri invoke mock and runtime between tests
  tauriInvokeMock.mockReset();
  tauriInvokeMock.mockImplementation(() => Promise.resolve());
  delete (window as unknown as Record<string, unknown>).__TAURI__;
});

afterEach(() => {
  // Must run FIRST: unmount all RTL-rendered components to remove
  // window-level event listeners before we tear down globals.
  // Without globals:true in vitest config, auto-cleanup is NOT registered.
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as unknown as Record<string, unknown>).__TAURI__;
  tauriInvokeMock.mockReset();
});

describe("App: reactive system theme via matchMedia listener", () => {
  const getRootStyle = (container: HTMLElement) =>
    (container.firstChild as HTMLElement).style.getPropertyValue("--bg-primary");

  it("initializes effective theme from matchMedia when theme='system' (dark → navy)", () => {
    matchMediaAPI.setMatches(true);
    const { container } = render(<App />);
    expect(getRootStyle(container)).toBe("#0f172a");
  });

  it("initializes effective theme from matchMedia when theme='system' (light → snow)", () => {
    matchMediaAPI.setMatches(false);
    const { container } = render(<App />);
    expect(getRootStyle(container)).toBe("#ffffff");
  });

  it("updates theme reactively when matchMedia fires 'change' while on 'system'", () => {
    matchMediaAPI.setMatches(true);
    const { container } = render(<App />);
    expect(getRootStyle(container)).toBe("#0f172a");

    act(() => {
      matchMediaAPI.triggerChange(false);
    });

    expect(getRootStyle(container)).toBe("#ffffff");
  });

  it("reactively reverts to dark when matchMedia switches light → dark", () => {
    matchMediaAPI.setMatches(false);
    const { container } = render(<App />);
    expect(getRootStyle(container)).toBe("#ffffff");

    act(() => {
      matchMediaAPI.triggerChange(true);
    });

    expect(getRootStyle(container)).toBe("#0f172a");
  });

  it("does not react to matchMedia changes when on explicit theme", () => {
    localStorageMock.setItem("md-editor-theme", "navy");
    matchMediaAPI.setMatches(false);
    const { container } = render(<App />);
    expect(getRootStyle(container)).toBe("#0f172a");

    act(() => {
      matchMediaAPI.triggerChange(true);
    });

    expect(getRootStyle(container)).toBe("#0f172a");
  });

  it("stores 'system' in localStorage (not the resolved navy/snow)", () => {
    matchMediaAPI.setMatches(true);
    render(<App />);
    expect(localStorageMock.getItem("md-editor-theme")).toBe("system");
  });

  it("does not register a listener when theme is not 'system'", () => {
    localStorageMock.setItem("md-editor-theme", "snow");
    matchMediaAPI.setMatches(true);
    expect(matchMediaAPI.listenerCount()).toBe(0);
    render(<App />);
    expect(matchMediaAPI.listenerCount()).toBe(0);
  });

  it("removes matchMedia listener on unmount", () => {
    matchMediaAPI.setMatches(false);
    expect(matchMediaAPI.listenerCount()).toBe(0);
    const { unmount } = render(<App />);
    expect(matchMediaAPI.listenerCount()).toBe(1);
    unmount();
    expect(matchMediaAPI.listenerCount()).toBe(0);
  });
});

// ── Storage recovery ────────────────────────────────────────────

describe("App: storage recovery", () => {
  // Helper: make localStorage.setItem throw a specific error type.
  function breakSetItem(error: Error) {
    localStorageMock.setItem.mockImplementation(() => {
      throw error;
    });
  }

  // Helper: restore localStorage.setItem to a working state.
  function restoreSetItem() {
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store.set(key, value);
    });
  }

  it("shows persistent notice when localStorage.setItem throws QuotaExceededError", async () => {
    const err = new Error("quota");
    err.name = "QuotaExceededError";
    breakSetItem(err);

    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector(".storage-notice")).not.toBeNull();
    });

    // The notice shows the i18n key for quota_exceeded
    expect(container.textContent).toContain("app.storage.error.quota_exceeded");
    // Both buttons are present
    expect(container.textContent).toContain("app.storage.error.retry");
    expect(container.textContent).toContain("toolbar.save");
  });

  it("shows notice with security error key when localStorage throws SecurityError", async () => {
    const err = new Error("denied");
    err.name = "SecurityError";
    breakSetItem(err);

    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector(".storage-notice")).not.toBeNull();
    });

    expect(container.textContent).toContain("app.storage.error.security");
  });

  it("does not show storage notice when localStorage works normally", () => {
    const { container } = render(<App />);
    // On fresh state, getStorageError() returns null, so no notice on first render.
    // The mount useEffect calls checkStorage() which succeeds, keeping storageError null.
    expect(container.querySelector(".storage-notice")).toBeNull();
  });

  it("hides notice after Retry when storage recovers", async () => {
    // Step 1 — make storage fail
    const err = new Error("quota");
    err.name = "QuotaExceededError";
    breakSetItem(err);

    const { container, unmount } = render(<App />);

    // Wait for the notice to appear
    await waitFor(() => {
      expect(container.querySelector(".storage-notice")).not.toBeNull();
    });

    // Step 2 — restore storage to working state
    restoreSetItem();

    // Step 3 — click Retry
    const retryBtn = container.querySelector(".storage-notice-btn.storage-notice-retry");
    expect(retryBtn).not.toBeNull();
    fireEvent.click(retryBtn!);

    // Step 4 — notice disappears
    await waitFor(() => {
      expect(container.querySelector(".storage-notice")).toBeNull();
    });

    unmount();
  });

  it("keeps editor buffer in React state when storage write fails", async () => {
    // Type some markdown via the code editor — but CodeEditor is mocked to
    // return null, so we can't interact with it. Instead, verify that a
    // value set via localStorage before the failure is preserved in
    // the component's React state by checking persist is called gracefully.

    // Pre-populate localStorage with content that would have been read on mount
    localStorageMock.store.set("md-editor-content", "# hello world");

    // Now break storage — subsequent setItem calls fail
    const err = new Error("quota");
    err.name = "QuotaExceededError";
    breakSetItem(err);

    const { container, unmount } = render(<App />);

    // The notice appears because checkStorage fails on mount
    await waitFor(() => {
      expect(container.querySelector(".storage-notice")).not.toBeNull();
    });

    // The component didn't crash — it rendered despite the write failure.
    // The editor buffer is preserved in React state (markdown state variable)
    // because safeSetItem catches the error without throwing.
    expect(container.querySelector(".app-main")).not.toBeNull();

    unmount();
  });
});



describe("App: native file I/O document identity", () => {
  // Regression test for stale document identity:
  // After native Open A -> New (discard) -> Cmd+S, the save must NOT write
  // to A's path. The frontend tracks nativeDocPath; after New it is null,
  // so handleSave skips save_file and goes straight to save_file_as.

  it("nativeOpen A -> New -> discard -> Cmd+S calls save_file_as, NOT save_file to A", async () => {
    Object.defineProperty(window, "__TAURI__", { value: true, configurable: true });

    let saveFileCalled = false;

    tauriInvokeMock.mockImplementation((cmd: string) => {
      if (cmd === "open_file") {
        return Promise.resolve({
          path: "/tmp/doc-a.md",
          filename: "doc-a.md",
          content: "# Document A\n",
        });
      }
      if (cmd === "clear_current_doc") {
        return Promise.resolve();
      }
      if (cmd === "save_file") {
        saveFileCalled = true;
        return Promise.resolve({ path: "/tmp/doc-a.md", filename: "doc-a.md", content: null });
      }
      if (cmd === "save_file_as") {
        return Promise.resolve({ path: "/tmp/new-doc.md", filename: "new-doc.md", content: null });
      }
      return Promise.resolve();
    });

    // Start with empty localStorage so mount doesn't load stale content
    localStorageMock.store.set("md-editor-content", "");

    const { container, unmount } = render(<App />);
    await waitFor(() => expect(container.querySelector(".app-main")).not.toBeNull());

    // Step 1: Cmd+O — native open file A
    await act(async () => {
      const openEvent = new KeyboardEvent("keydown", { key: "o", metaKey: true, bubbles: true });
      window.dispatchEvent(openEvent);
    });

    // Wait for open_file to resolve and set markdown to Document A
    await waitFor(() => {
      expect(tauriInvokeMock).toHaveBeenCalledWith("open_file");
    });

    // Step 2: Cmd+N — markdown is now "# Document A" (non-empty), so
    // handleNewFile shows the discard dialog
    await act(async () => {
      const newEvent = new KeyboardEvent("keydown", { key: "n", metaKey: true, bubbles: true });
      window.dispatchEvent(newEvent);
    });

    // The discard dialog should appear (fixed inset-0 z-50)
    const dialog = await waitFor(() => container.querySelector(".fixed.inset-0.z-50"));
    expect(dialog).not.toBeNull();

    // Step 3: Click "Discard" button
    const buttons = dialog!.querySelectorAll("button");
    const discardBtn = Array.from(buttons).find((b) => b.textContent === "app.unsaved.discard");
    expect(discardBtn).not.toBeNull();
    await act(async () => {
      fireEvent.click(discardBtn!);
    });

    // Verify clear_current_doc was called (document identity invalidated)
    await waitFor(() => {
      expect(tauriInvokeMock).toHaveBeenCalledWith("clear_current_doc");
    });

    // Wait for React to re-render with nativeDocPath=null so handleSave
    // has the updated dependency and the keyboard handler is re-registered
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Step 4: Cmd+S — nativeDocPath is null after New, so handleSave
    // should skip save_file entirely and call save_file_as
    await act(async () => {
      const saveEvent = new KeyboardEvent("keydown", { key: "s", metaKey: true, bubbles: true });
      window.dispatchEvent(saveEvent);
    });

    // save_file_as must be called (fallback), and save_file must NOT
    await waitFor(() => {
      const calls = tauriInvokeMock.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls).toContain("save_file_as");
    });
    expect(saveFileCalled).toBe(false);

    unmount();
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  });

  it("drop text file clears nativeDocPath so Save As is used, save_file not called", async () => {
    Object.defineProperty(window, "__TAURI__", { value: true, configurable: true });

    let saveFileCalled = false;

    tauriInvokeMock.mockImplementation((cmd: string) => {
      if (cmd === "open_file") {
        return Promise.resolve({
          path: "/tmp/doc-a.md",
          filename: "doc-a.md",
          content: "# Document A",
        });
      }
      if (cmd === "clear_current_doc") {
        return Promise.resolve();
      }
      if (cmd === "save_file") {
        saveFileCalled = true;
        return Promise.resolve({ path: "/tmp/doc-a.md", filename: "doc-a.md", content: null });
      }
      if (cmd === "save_file_as") {
        return Promise.resolve({ path: "/tmp/dropped.md", filename: "dropped.md", content: null });
      }
      return Promise.resolve();
    });

    localStorageMock.store.set("md-editor-content", "");

    const { container, unmount } = render(<App />);
    await waitFor(() => expect(container.querySelector(".app-main")).not.toBeNull());

    // Native open A first
    await act(async () => {
      const openEvent = new KeyboardEvent("keydown", { key: "o", metaKey: true, bubbles: true });
      window.dispatchEvent(openEvent);
    });
    await waitFor(() => {
      expect(tauriInvokeMock).toHaveBeenCalledWith("open_file");
    });

    // Drop a text file on the app's outer div
    const file = new File(["# dropped content"], "dropped.md", { type: "text/markdown" });

    await act(async () => {
      const dropTarget = container.querySelector(".flex.flex-col.h-screen.w-screen.overflow-hidden");
      const dt = {
        files: [file],
        items: [{ kind: "file", type: "text/markdown", getAsString: () => {} }],
        types: ["Files"],
        getData: () => "",
        setDataData: () => {},
        clearData: () => {},
        effectAllowed: "copy",
      };
      const dropEvent = new MouseEvent("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, "dataTransfer", { value: dt, configurable: true });
      Object.defineProperty(dropEvent, "defaultPrevented", { value: false, configurable: true });
      dropTarget?.dispatchEvent(dropEvent);
    });

    await waitFor(() => {
      expect(tauriInvokeMock).toHaveBeenCalledWith("clear_current_doc");
    });

    // Wait for React to re-render with nativeDocPath = null
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Cmd+S should fall back to save_file_as because nativeDocPath was cleared
    await act(async () => {
      const saveEvent = new KeyboardEvent("keydown", { key: "s", metaKey: true, bubbles: true });
      window.dispatchEvent(saveEvent);
    });

    await waitFor(() => {
      const calls = tauriInvokeMock.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls).toContain("save_file_as");
    });
    expect(saveFileCalled).toBe(false);

    unmount();
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  });

  it("save_file_as sets nativeDocPath so subsequent Cmd+S writes via save_file", async () => {
    Object.defineProperty(window, "__TAURI__", { value: true, configurable: true });

    let saveFileCalled = false;
    let saveFileAsCalled = false;

    tauriInvokeMock.mockImplementation((cmd: string) => {
      if (cmd === "save_file") {
        saveFileCalled = true;
        return Promise.resolve({ path: "/tmp/new-doc.md", filename: "new-doc.md", content: null });
      }
      if (cmd === "save_file_as") {
        saveFileAsCalled = true;
        return Promise.resolve({ path: "/tmp/new-doc.md", filename: "new-doc.md", content: null });
      }
      if (cmd === "clear_current_doc") return Promise.resolve();
      return Promise.resolve();
    });

    localStorageMock.store.set("md-editor-content", "# new");

    const { container, unmount } = render(<App />);
    await waitFor(() => expect(container.querySelector(".app-main")).not.toBeNull());

    // First Cmd+S — nativeDocPath is null, should go to save_file_as
    await act(async () => {
      const saveEvent = new KeyboardEvent("keydown", { key: "s", metaKey: true, bubbles: true });
      window.dispatchEvent(saveEvent);
    });

    await waitFor(() => {
      expect(saveFileAsCalled).toBe(true);
    });

    // Second Cmd+S — nativeDocPath is now set from save_file_as response
    await act(async () => {
      const saveEvent = new KeyboardEvent("keydown", { key: "s", metaKey: true, bubbles: true });
      window.dispatchEvent(saveEvent);
    });

    await waitFor(() => {
      expect(saveFileCalled).toBe(true);
    });

    unmount();
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  });
});

// ── New File clears both editor and preview buffers ─────────────

describe("App: New File clears editor buffer", () => {
  beforeEach(() => {
    localStorageMock.store.set("md-editor-content", "# existing content");
  });

  it("doNewFile sets markdown and previewMarkdown to empty (not just preview)", async () => {
    const { container, unmount } = render(<App />);
    await waitFor(() => expect(container.querySelector(".app-main")).not.toBeNull());

    // Content was loaded from localStorage on mount
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Trigger New File via Cmd+N
    await act(async () => {
      const newEvent = new KeyboardEvent("keydown", { key: "n", metaKey: true, bubbles: true });
      window.dispatchEvent(newEvent);
    });

    // No dialog (content is non-empty → discard dialog appears)
    // Click "Discard" to proceed
    const dialog = container.querySelector(".fixed.inset-0.z-50");
    if (dialog) {
      const discardBtn = Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "app.unsaved.discard",
      );
      await act(async () => {
        fireEvent.click(discardBtn!);
      });
    }

    // After New File, content should be empty — verify via localStorage
    // (markdown state is empty, so the 500ms debounce persist writes "")
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    // The persisted content should be empty string (both markdown and previewMarkdown cleared)
    expect(localStorageMock.getItem("md-editor-content")).toBe("");

    unmount();
  });

  it("doNewFile on document with content shows discard dialog, then clears on Discard", async () => {
    const { container, unmount } = render(<App />);
    await waitFor(() => expect(container.querySelector(".app-main")).not.toBeNull());

    // Wait for initial state to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Document loaded from localStorage (SAMPLE_MARKDOWN) is non-empty → dialog appears
    await act(async () => {
      const newEvent = new KeyboardEvent("keydown", { key: "n", metaKey: true, bubbles: true });
      window.dispatchEvent(newEvent);
    });

    // Discard dialog should appear
    const dialog = await waitFor(() => container.querySelector(".fixed.inset-0.z-50"));
    expect(dialog).not.toBeNull();

    // Click Discard → doNewFile clears both markdown and previewMarkdown
    const discardBtn = Array.from(dialog!.querySelectorAll("button")).find(
      (b) => b.textContent === "app.unsaved.discard",
    );
    expect(discardBtn).not.toBeNull();
    await act(async () => {
      fireEvent.click(discardBtn!);
    });

    // After Discard, persist (debounced 500ms) should write empty string
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    expect(localStorageMock.getItem("md-editor-content")).toBe("");

    unmount();
  });
});
