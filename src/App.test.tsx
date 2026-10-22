import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

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

beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal("localStorage", localStorageMock);
  matchMediaAPI.setMatches(false);
  matchMediaAPI.clearListeners();
  vi.stubGlobal("matchMedia", () => matchMediaAPI.mq as unknown as MediaQueryList);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
