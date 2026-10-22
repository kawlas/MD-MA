export type ViewMode = "code" | "preview" | "split";
export type ThemeName =
  | "system"
  | "snow"
  | "ivory"
  | "navy"
  | "midnight"
  | "slate"
  | "ocean"
  | "storm"
  | "twilight"
  | "onyx"
  | "sepia"
  | "githubDark"
  | "nord"
  | "tokyoNight"
  | "solarizedLight"
  | "solarizedDark"
  | "paper"
  | "ink"
  | "neutralLight"
  | "neutralDark";
export type EffectiveTheme =
  | "snow"
  | "ivory"
  | "navy"
  | "midnight"
  | "slate"
  | "ocean"
  | "storm"
  | "twilight"
  | "onyx"
  | "sepia"
  | "githubDark"
  | "nord"
  | "tokyoNight"
  | "solarizedLight"
  | "solarizedDark"
  | "paper"
  | "ink"
  | "neutralLight"
  | "neutralDark";

export interface TocItem {
  id: string;
  level: number;
  text: string;
  line: number;
}

export interface TextStats {
  words: number;
  lines: number;
  characters: number;
  readTime: string;
}

export type ThemeVars = Record<string, string>;

export const THEMES: Record<EffectiveTheme, ThemeVars> = {
  snow: {
    "--bg-primary": "#ffffff",
    "--bg-secondary": "#f8fafc",
    "--bg-toolbar": "rgba(255,255,255,0.85)",
    "--text-primary": "#0f172a",
    "--text-secondary": "#475569",
    "--text-muted": "#94a3b8",
    "--border": "#e2e8f0",
    "--accent": "#2563eb",
    "--accent-hover": "#1d4ed8",
    "--accent-bg": "#eff6ff",
    "--code-bg": "#1e1e2e",
    "--scrollbar-track": "#f1f5f9",
    "--scrollbar-thumb": "#cbd5e1",
    "--callout-note-bg": "#dbeafe",
    "--callout-note-border": "#3b82f6",
    "--callout-tip-bg": "#dcfce7",
    "--callout-tip-border": "#22c55e",
    "--callout-important-bg": "#fef9c3",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#ffedd5",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#fee2e2",
    "--callout-caution-border": "#ef4444",
  },
  ivory: {
    "--bg-primary": "#faf8f5",
    "--bg-secondary": "#f5f0eb",
    "--bg-toolbar": "rgba(250,248,245,0.85)",
    "--text-primary": "#2d2a24",
    "--text-secondary": "#6b5c47",
    "--text-muted": "#a89a83",
    "--border": "#e3dcd0",
    "--accent": "#b45309",
    "--accent-hover": "#9a3e06",
    "--accent-bg": "#fef3e7",
    "--code-bg": "#2b2520",
    "--scrollbar-track": "#efe3c8",
    "--scrollbar-thumb": "#c9b98a",
    "--callout-note-bg": "#e8e0d0",
    "--callout-note-border": "#8b7d65",
    "--callout-tip-bg": "#dce8cc",
    "--callout-tip-border": "#7a9a5a",
    "--callout-important-bg": "#f0e8cc",
    "--callout-important-border": "#c4a832",
    "--callout-warning-bg": "#f0dccc",
    "--callout-warning-border": "#d4883a",
    "--callout-caution-bg": "#f0ccc0",
    "--callout-caution-border": "#c85a4a",
  },
  navy: {
    "--bg-primary": "#0f172a",
    "--bg-secondary": "#1e293b",
    "--bg-toolbar": "rgba(15,23,42,0.92)",
    "--text-primary": "#e2e8f0",
    "--text-secondary": "#94a3b8",
    "--text-muted": "#64748b",
    "--border": "#334155",
    "--accent": "#60a5fa",
    "--accent-hover": "#93c5fd",
    "--accent-bg": "#1e3a5f",
    "--code-bg": "#0a0f1e",
    "--scrollbar-track": "#1e293b",
    "--scrollbar-thumb": "#475569",
    "--callout-note-bg": "#172554",
    "--callout-note-border": "#3b82f6",
    "--callout-tip-bg": "#14532d",
    "--callout-tip-border": "#22c55e",
    "--callout-important-bg": "#422006",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#431407",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#450a0a",
    "--callout-caution-border": "#ef4444",
  },
  midnight: {
    "--bg-primary": "#0a0e1a",
    "--bg-secondary": "#131827",
    "--bg-toolbar": "rgba(10,14,26,0.92)",
    "--text-primary": "#c8d0dc",
    "--text-secondary": "#7b8ba3",
    "--text-muted": "#525e73",
    "--border": "#1f2a3d",
    "--accent": "#818cf8",
    "--accent-hover": "#a5b4fc",
    "--accent-bg": "#1e1b4b",
    "--code-bg": "#060912",
    "--scrollbar-track": "#131827",
    "--scrollbar-thumb": "#2a3448",
    "--callout-note-bg": "#1a1b3e",
    "--callout-note-border": "#6366f1",
    "--callout-tip-bg": "#14302a",
    "--callout-tip-border": "#34d399",
    "--callout-important-bg": "#3a2e10",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#3a1f0e",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#3a0e0e",
    "--callout-caution-border": "#ef4444",
  },
  slate: {
    "--bg-primary": "#111827",
    "--bg-secondary": "#1f2937",
    "--bg-toolbar": "rgba(17,24,39,0.92)",
    "--text-primary": "#d1d5db",
    "--text-secondary": "#9ca3af",
    "--text-muted": "#6b7280",
    "--border": "#374151",
    "--accent": "#14b8a6",
    "--accent-hover": "#2dd4bf",
    "--accent-bg": "#134e4a",
    "--code-bg": "#0d1520",
    "--scrollbar-track": "#1f2937",
    "--scrollbar-thumb": "#4b5563",
    "--callout-note-bg": "#172554",
    "--callout-note-border": "#3b82f6",
    "--callout-tip-bg": "#0f3d30",
    "--callout-tip-border": "#14b8a6",
    "--callout-important-bg": "#3a2e10",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#3a1f0e",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#3a0e0e",
    "--callout-caution-border": "#ef4444",
  },
  ocean: {
    "--bg-primary": "#0c1929",
    "--bg-secondary": "#0f2035",
    "--bg-toolbar": "rgba(12,25,41,0.92)",
    "--text-primary": "#c5d5e6",
    "--text-secondary": "#7a9bbf",
    "--text-muted": "#4d6a8a",
    "--border": "#1a3050",
    "--accent": "#38bdf8",
    "--accent-hover": "#7dd3fc",
    "--accent-bg": "#0c4a6e",
    "--code-bg": "#081420",
    "--scrollbar-track": "#0f2035",
    "--scrollbar-thumb": "#1e3a5f",
    "--callout-note-bg": "#0c2d4a",
    "--callout-note-border": "#38bdf8",
    "--callout-tip-bg": "#0a3328",
    "--callout-tip-border": "#22c55e",
    "--callout-important-bg": "#332a10",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#331a0e",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#330e0e",
    "--callout-caution-border": "#ef4444",
  },
  storm: {
    "--bg-primary": "#121820",
    "--bg-secondary": "#1a222c",
    "--bg-toolbar": "rgba(18,24,32,0.92)",
    "--text-primary": "#cbd5e1",
    "--text-secondary": "#8899aa",
    "--text-muted": "#5a6a7a",
    "--border": "#2a3440",
    "--accent": "#34d399",
    "--accent-hover": "#6ee7b7",
    "--accent-bg": "#0d3a2a",
    "--code-bg": "#0d131c",
    "--scrollbar-track": "#1a222c",
    "--scrollbar-thumb": "#334155",
    "--callout-note-bg": "#1a2540",
    "--callout-note-border": "#3b82f6",
    "--callout-tip-bg": "#0d3022",
    "--callout-tip-border": "#34d399",
    "--callout-important-bg": "#332a10",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#331f0e",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#330e0e",
    "--callout-caution-border": "#ef4444",
  },
  twilight: {
    "--bg-primary": "#0f0f1a",
    "--bg-secondary": "#191928",
    "--bg-toolbar": "rgba(15,15,26,0.92)",
    "--text-primary": "#d4cde8",
    "--text-secondary": "#8b80a8",
    "--text-muted": "#5a5070",
    "--border": "#2a2640",
    "--accent": "#a78bfa",
    "--accent-hover": "#c4b5fd",
    "--accent-bg": "#2e1065",
    "--code-bg": "#0a0a14",
    "--scrollbar-track": "#191928",
    "--scrollbar-thumb": "#353050",
    "--callout-note-bg": "#1e1a40",
    "--callout-note-border": "#6366f1",
    "--callout-tip-bg": "#142820",
    "--callout-tip-border": "#34d399",
    "--callout-important-bg": "#332810",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#331c0e",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#330e0e",
    "--callout-caution-border": "#ef4444",
  },
  onyx: {
    "--bg-primary": "#0d0d0d",
    "--bg-secondary": "#1a1a1a",
    "--bg-toolbar": "rgba(13,13,13,0.92)",
    "--text-primary": "#d4d4d4",
    "--text-secondary": "#888888",
    "--text-muted": "#555555",
    "--border": "#2a2a2a",
    "--accent": "#e879f9",
    "--accent-hover": "#f0abfc",
    "--accent-bg": "#4a1d55",
    "--code-bg": "#080808",
    "--scrollbar-track": "#1a1a1a",
    "--scrollbar-thumb": "#333333",
    "--callout-note-bg": "#1a1a3a",
    "--callout-note-border": "#818cf8",
    "--callout-tip-bg": "#142818",
    "--callout-tip-border": "#22c55e",
    "--callout-important-bg": "#332810",
    "--callout-important-border": "#eab308",
    "--callout-warning-bg": "#331c0e",
    "--callout-warning-border": "#f97316",
    "--callout-caution-bg": "#330e0e",
    "--callout-caution-border": "#ef4444",
  },
  sepia: {
    "--bg-primary": "#faf4e8",
    "--bg-secondary": "#f2ead4",
    "--bg-toolbar": "rgba(250,244,232,0.85)",
    "--text-primary": "#433422",
    "--text-secondary": "#6b5c47",
    "--text-muted": "#a89a83",
    "--border": "#ddd0b8",
    "--accent": "#b8860b",
    "--accent-hover": "#9a7209",
    "--accent-bg": "#f0e4c4",
    "--code-bg": "#2b2520",
    "--scrollbar-track": "#efe3c8",
    "--scrollbar-thumb": "#c9b98a",
    "--callout-note-bg": "#e0dcc4",
    "--callout-note-border": "#8b7d65",
    "--callout-tip-bg": "#d8e8c0",
    "--callout-tip-border": "#7a9a5a",
    "--callout-important-bg": "#f2ecc0",
    "--callout-important-border": "#c4a832",
    "--callout-warning-bg": "#f2dcc0",
    "--callout-warning-border": "#d4883a",
    "--callout-caution-bg": "#f2ccc0",
    "--callout-caution-border": "#c85a4a",
  },
  githubDark: {
    "--bg-primary": "#0d1117",
    "--bg-secondary": "#161b22",
    "--bg-toolbar": "rgba(13,17,23,0.92)",
    "--text-primary": "#e6edf3",
    "--text-secondary": "#8b949e",
    "--text-muted": "#6e7681",
    "--border": "#30363d",
    "--accent": "#2f81f7",
    "--accent-hover": "#58a6ff",
    "--accent-bg": "#0d2d57",
    "--code-bg": "#010409",
    "--scrollbar-track": "#161b22",
    "--scrollbar-thumb": "#30363d",
    "--callout-note-bg": "#0d2d57",
    "--callout-note-border": "#2f81f7",
    "--callout-tip-bg": "#12361f",
    "--callout-tip-border": "#3fb950",
    "--callout-important-bg": "#3b2300",
    "--callout-important-border": "#d29922",
    "--callout-warning-bg": "#3b2300",
    "--callout-warning-border": "#d29922",
    "--callout-caution-bg": "#490202",
    "--callout-caution-border": "#f85149",
  },
  nord: {
    "--bg-primary": "#2e3440",
    "--bg-secondary": "#3b4252",
    "--bg-toolbar": "rgba(46,52,64,0.92)",
    "--text-primary": "#eceff4",
    "--text-secondary": "#d8dee9",
    "--text-muted": "#81a1c1",
    "--border": "#4c566a",
    "--accent": "#88c0d0",
    "--accent-hover": "#8fbcbb",
    "--accent-bg": "#40515f",
    "--code-bg": "#242933",
    "--scrollbar-track": "#3b4252",
    "--scrollbar-thumb": "#4c566a",
    "--callout-note-bg": "#34495e",
    "--callout-note-border": "#88c0d0",
    "--callout-tip-bg": "#31483f",
    "--callout-tip-border": "#a3be8c",
    "--callout-important-bg": "#51462d",
    "--callout-important-border": "#ebcb8b",
    "--callout-warning-bg": "#533f32",
    "--callout-warning-border": "#d08770",
    "--callout-caution-bg": "#54343b",
    "--callout-caution-border": "#bf616a",
  },
  tokyoNight: {
    "--bg-primary": "#1a1b26",
    "--bg-secondary": "#24283b",
    "--bg-toolbar": "rgba(26,27,38,0.92)",
    "--text-primary": "#c0caf5",
    "--text-secondary": "#a9b1d6",
    "--text-muted": "#565f89",
    "--border": "#414868",
    "--accent": "#7aa2f7",
    "--accent-hover": "#9ece6a",
    "--accent-bg": "#283457",
    "--code-bg": "#16161e",
    "--scrollbar-track": "#24283b",
    "--scrollbar-thumb": "#414868",
    "--callout-note-bg": "#223153",
    "--callout-note-border": "#7aa2f7",
    "--callout-tip-bg": "#243b35",
    "--callout-tip-border": "#9ece6a",
    "--callout-important-bg": "#3f3650",
    "--callout-important-border": "#bb9af7",
    "--callout-warning-bg": "#46351f",
    "--callout-warning-border": "#e0af68",
    "--callout-caution-bg": "#47242b",
    "--callout-caution-border": "#f7768e",
  },
  solarizedLight: {
    "--bg-primary": "#fdf6e3",
    "--bg-secondary": "#eee8d5",
    "--bg-toolbar": "rgba(253,246,227,0.88)",
    "--text-primary": "#073642",
    "--text-secondary": "#586e75",
    "--text-muted": "#93a1a1",
    "--border": "#d7cfb7",
    "--accent": "#268bd2",
    "--accent-hover": "#2aa198",
    "--accent-bg": "#dcebf0",
    "--code-bg": "#002b36",
    "--scrollbar-track": "#eee8d5",
    "--scrollbar-thumb": "#93a1a1",
    "--callout-note-bg": "#dbeaf0",
    "--callout-note-border": "#268bd2",
    "--callout-tip-bg": "#dbe8d0",
    "--callout-tip-border": "#859900",
    "--callout-important-bg": "#f3e7c4",
    "--callout-important-border": "#b58900",
    "--callout-warning-bg": "#f1ddc8",
    "--callout-warning-border": "#cb4b16",
    "--callout-caution-bg": "#efd4cf",
    "--callout-caution-border": "#dc322f",
  },
  solarizedDark: {
    "--bg-primary": "#002b36",
    "--bg-secondary": "#073642",
    "--bg-toolbar": "rgba(0,43,54,0.92)",
    "--text-primary": "#eee8d5",
    "--text-secondary": "#93a1a1",
    "--text-muted": "#657b83",
    "--border": "#214852",
    "--accent": "#268bd2",
    "--accent-hover": "#2aa198",
    "--accent-bg": "#123d4a",
    "--code-bg": "#001f27",
    "--scrollbar-track": "#073642",
    "--scrollbar-thumb": "#586e75",
    "--callout-note-bg": "#123d4a",
    "--callout-note-border": "#268bd2",
    "--callout-tip-bg": "#273f35",
    "--callout-tip-border": "#859900",
    "--callout-important-bg": "#3d3716",
    "--callout-important-border": "#b58900",
    "--callout-warning-bg": "#432713",
    "--callout-warning-border": "#cb4b16",
    "--callout-caution-bg": "#431f20",
    "--callout-caution-border": "#dc322f",
  },

  /* === Nowe palety (dodane 2026-10-22) ===
     Każdy z 4 wariantów jest mierzony: tekst >= 4.5:1, obramowanie kontrolki >= 3:1.
     Dowód: .design/presets-report.md + src/types.test.ts */
  paper: {
    "--bg-primary": "#f7f4ec",
    "--bg-secondary": "#eee9dd",
    "--bg-toolbar": "rgba(247,244,236,0.92)",
    "--text-primary": "#1f1d18",
    "--text-secondary": "#4d4839",
    "--text-muted": "#6b6552",
    "--border": "#ddd5c4",
    "--border-control": "#847c66",
    "--accent": "#1f6b4a",
    "--accent-hover": "#17583c",
    "--accent-bg": "#dcebe2",
    "--accent-contrast": "#ffffff",
    "--code-bg": "#22201b",
    "--scrollbar-track": "#eee9dd",
    "--scrollbar-thumb": "#c9c1ae",
    "--callout-note-bg": "#e3e8ef",
    "--callout-note-border": "#3b5f8f",
    "--callout-tip-bg": "#e0ecdf",
    "--callout-tip-border": "#3f7048",
    "--callout-important-bg": "#f4ecd3",
    "--callout-important-border": "#8a6d16",
    "--callout-warning-bg": "#f7e6d5",
    "--callout-warning-border": "#9c5a1c",
    "--callout-caution-bg": "#f5e0dd",
    "--callout-caution-border": "#a03a30",
  },
  ink: {
    "--bg-primary": "#17140f",
    "--bg-secondary": "#211d16",
    "--bg-toolbar": "rgba(23,20,15,0.92)",
    "--text-primary": "#ece5d9",
    "--text-secondary": "#bcb2a3",
    "--text-muted": "#93897b",
    "--border": "#2f2920",
    "--border-control": "#716756",
    "--accent": "#e0a355",
    "--accent-hover": "#eeb871",
    "--accent-bg": "#2c2317",
    "--accent-contrast": "#17140f",
    "--code-bg": "#100d0a",
    "--scrollbar-track": "#211d16",
    "--scrollbar-thumb": "#453d31",
    "--callout-note-bg": "#1a1f26",
    "--callout-note-border": "#6d8fb5",
    "--callout-tip-bg": "#1a221a",
    "--callout-tip-border": "#74a06f",
    "--callout-important-bg": "#28230f",
    "--callout-important-border": "#c2ab44",
    "--callout-warning-bg": "#2c2010",
    "--callout-warning-border": "#cf9040",
    "--callout-caution-bg": "#2b1613",
    "--callout-caution-border": "#cf6a5c",
  },
  neutralLight: {
    "--bg-primary": "#f7f9fa",
    "--bg-secondary": "#ecf0f3",
    "--bg-toolbar": "rgba(247,249,250,0.92)",
    "--text-primary": "#15181b",
    "--text-secondary": "#3f464d",
    "--text-muted": "#59626a",
    "--border": "#dae0e5",
    "--border-control": "#767f88",
    "--accent": "#0a626b",
    "--accent-hover": "#084e55",
    "--accent-bg": "#d8ebec",
    "--accent-contrast": "#ffffff",
    "--code-bg": "#1b2126",
    "--scrollbar-track": "#ecf0f3",
    "--scrollbar-thumb": "#c2cbd2",
    "--callout-note-bg": "#e2e8ee",
    "--callout-note-border": "#33587f",
    "--callout-tip-bg": "#dfeae3",
    "--callout-tip-border": "#356a52",
    "--callout-important-bg": "#f1ecd9",
    "--callout-important-border": "#7d6a1c",
    "--callout-warning-bg": "#f5e5d8",
    "--callout-warning-border": "#96551f",
    "--callout-caution-bg": "#f4e0de",
    "--callout-caution-border": "#9c3b36",
  },
  neutralDark: {
    "--bg-primary": "#12161a",
    "--bg-secondary": "#1a1f24",
    "--bg-toolbar": "rgba(18,22,26,0.92)",
    "--text-primary": "#e8edf1",
    "--text-secondary": "#b2bcc4",
    "--text-muted": "#8c97a0",
    "--border": "#262d33",
    "--border-control": "#616d76",
    "--accent": "#b8d16f",
    "--accent-hover": "#cbe28d",
    "--accent-bg": "#1e2512",
    "--accent-contrast": "#12161a",
    "--code-bg": "#0c1013",
    "--scrollbar-track": "#1a1f24",
    "--scrollbar-thumb": "#3a434a",
    "--callout-note-bg": "#17202a",
    "--callout-note-border": "#5b86b8",
    "--callout-tip-bg": "#16241a",
    "--callout-tip-border": "#5fa074",
    "--callout-important-bg": "#26230f",
    "--callout-important-border": "#bfae4a",
    "--callout-warning-bg": "#2a1f11",
    "--callout-warning-border": "#c99247",
    "--callout-caution-bg": "#2a1512",
    "--callout-caution-border": "#cf6a5f",
  },
};

/** Single source of truth for all built-in theme names (excludes 'system' preference). */
export const THEME_LIST: EffectiveTheme[] = Object.keys(THEMES) as EffectiveTheme[];

/** Czytelne nazwy motywów (camelCase -> "Neutral Light"). */
export const THEME_LABELS: Record<string, string> = {
  paper: "Paper",
  ink: "Ink",
  neutralLight: "Neutral Light",
  neutralDark: "Neutral Dark",
};

export function getEffectiveTheme(theme: ThemeName, systemPrefersDark?: boolean): EffectiveTheme {
  if (theme === "system") {
    const dark = systemPrefersDark ?? window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark ? "navy" : "snow";
  }
  return theme as EffectiveTheme;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return debounced as T & { cancel: () => void };
}

export function extractToc(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;
  const seenIds = new Map<string, number>();

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2]
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .trim();
      const baseId = slugify(text);
      const count = (seenIds.get(baseId) ?? 0) + 1;
      seenIds.set(baseId, count);
      headings.push({ id: count === 1 ? baseId : `${baseId}-${count}`, level, text, line: lineNumber });
    }
  }

  return headings;
}

export function getStats(markdown: string): TextStats {
  const text = markdown.trim();
  if (!text) return { words: 0, lines: 0, characters: 0, readTime: "< 1 min" };
  const words = text.split(/\s+/).filter(Boolean).length;
  const lines = text.split("\n").length;
  const characters = text.length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const readTime = minutes <= 1 ? "< 1 min" : `~${minutes} min`;
  return { words, lines, characters, readTime };
}

export interface FontSet {
  /** Stabilny identyfikator (zapisuje się w localStorage — nie zmieniaj nazw istniejących presetów). */
  id: string;
  /** Stabilna nazwa techniczna (klucz zapisu preferencji). */
  label: string;
  /** Nazwa pokazywana w UI (gdy brak — używany jest `label`). */
  display?: string;
  /** true = krój osadzony w aplikacji (działa offline, PL + kursywa + bold). */
  bundled?: boolean;
  body: string;
  code: string;
  bodySize: number;
  codeSize: number;
  lineHeight: number;
}

/** Stosy kodu dla nowych, osadzonych krojów (JetBrains Mono z repo, z fallbackiem na SF Mono). */
const MONO_BUNDLED = `'JetBrains Mono', 'SF Mono', Menlo, Monaco, 'Consolas', monospace`;

export const FONT_SETS: FontSet[] = [
  {
    id: "system",
    label: "System",
    body: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif`,
    code: `'SF Mono', Menlo, Monaco, monospace`,
    bodySize: 16,
    codeSize: 14,
    lineHeight: 1.72,
  },
  {
    id: "inter-jetbrains",
    label: "Inter + JetBrains",
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    code: `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`,
    bodySize: 15.5,
    codeSize: 13.5,
    lineHeight: 1.68,
  },
  {
    id: "new-york",
    label: "New York",
    body: `'New York', 'Iowan Old Style', 'Georgia', 'Times New Roman', serif`,
    code: `'SF Mono', Menlo, Monaco, monospace`,
    bodySize: 17,
    codeSize: 13.5,
    lineHeight: 1.8,
  },
  {
    id: "sf-rounded",
    label: "SF Rounded",
    body: `'SF Pro Rounded', 'Rounded Mplus 1c', system-ui, sans-serif`,
    code: `'SF Mono', 'JetBrains Mono', monospace`,
    bodySize: 16,
    codeSize: 14,
    lineHeight: 1.7,
  },
  {
    id: "helvetica-neue",
    label: "Helvetica Neue",
    body: `'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`,
    code: `'SF Mono', Menlo, monospace`,
    bodySize: 15.5,
    codeSize: 13.5,
    lineHeight: 1.68,
  },
  {
    id: "mono",
    label: "Mono",
    body: `'SF Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace`,
    code: `'SF Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace`,
    bodySize: 15,
    codeSize: 14,
    lineHeight: 1.65,
  },
  {
    id: "atkinson",
    label: "Atkinson",
    display: "Atkinson Hyperlegible",
    bundled: true,
    body: `'Atkinson Hyperlegible', 'Segoe UI', system-ui, sans-serif`,
    code: MONO_BUNDLED,
    bodySize: 16.5,
    codeSize: 14,
    lineHeight: 1.78,
  },
  {
    id: "ibm-plex",
    label: "IBM Plex",
    body: `'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif`,
    code: `'IBM Plex Mono', 'SF Mono', monospace`,
    bodySize: 16,
    codeSize: 13.5,
    lineHeight: 1.72,
  },

  /* === Nowe zestawy z osadzonymi krojami OFL (src/assets/fonts) === */
  {
    id: "literata",
    bundled: true,
    label: "Literata",
    body: `'Literata', 'Iowan Old Style', Georgia, 'Times New Roman', serif`,
    code: MONO_BUNDLED,
    bodySize: 17,
    codeSize: 13.5,
    lineHeight: 1.78,
  },
  {
    id: "sourceserif4",
    bundled: true,
    label: "Source Serif 4",
    body: `'Source Serif 4', Georgia, 'Times New Roman', serif`,
    code: MONO_BUNDLED,
    bodySize: 16,
    codeSize: 13.5,
    lineHeight: 1.62,
  },
  {
    id: "lora",
    bundled: true,
    label: "Lora",
    body: `'Lora', Georgia, 'Times New Roman', serif`,
    code: MONO_BUNDLED,
    bodySize: 16,
    codeSize: 13.5,
    lineHeight: 1.66,
  },
  {
    id: "jetbrains-mono",
    bundled: true,
    label: "JetBrains Mono",
    body: MONO_BUNDLED,
    code: MONO_BUNDLED,
    bodySize: 14.5,
    codeSize: 14,
    lineHeight: 1.58,
  },
];

export type BlockType =
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "paragraph"
  | "code"
  | "list"
  | "blockquote"
  | "table"
  | "thematicBreak";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

function blockId(content: string, startOffset: number): string {
  let hash = 2166136261;
  const input = `${startOffset}:${content}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `b${(hash >>> 0).toString(36)}`;
}

export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");
  const lineStarts: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1;
  }

  const current: { line: string; lineNumber: number }[] = [];
  let inCodeBlock = false;

  function makeBlock(content: string, startLine: number, endLine: number): Block {
    const trimmed = content.trimStart();
    const firstLine = trimmed.split("\n")[0];
    const startOffset = lineStarts[startLine] ?? 0;
    const endOffset = startOffset + content.length;

    if (inCodeBlock || trimmed.startsWith("```")) {
      return { id: blockId(content, startOffset), type: "code", content, startLine, endLine, startOffset, endOffset };
    }

    const headingMatch = firstLine.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return {
        id: blockId(content, startOffset),
        type: `heading${level}` as BlockType,
        content,
        startLine,
        endLine,
        startOffset,
        endOffset,
      };
    }

    if (firstLine.startsWith("|")) {
      return { id: blockId(content, startOffset), type: "table", content, startLine, endLine, startOffset, endOffset };
    }

    if (firstLine.startsWith(">")) {
      return {
        id: blockId(content, startOffset),
        type: "blockquote",
        content,
        startLine,
        endLine,
        startOffset,
        endOffset,
      };
    }

    if (/^[-*+]\s/.test(firstLine) || /^\d+[.)]\s/.test(firstLine)) {
      return { id: blockId(content, startOffset), type: "list", content, startLine, endLine, startOffset, endOffset };
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(firstLine.trim())) {
      return {
        id: blockId(content, startOffset),
        type: "thematicBreak",
        content,
        startLine,
        endLine,
        startOffset,
        endOffset,
      };
    }

    return {
      id: blockId(content, startOffset),
      type: "paragraph",
      content,
      startLine,
      endLine,
      startOffset,
      endOffset,
    };
  }

  function flush() {
    if (current.length === 0) return;
    blocks.push(
      makeBlock(
        current.map((item) => item.line).join("\n"),
        current[0].lineNumber,
        current[current.length - 1].lineNumber,
      ),
    );
    current.length = 0;
  }

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    if (line.trimStart().startsWith("```")) {
      current.push({ line, lineNumber });
      if (inCodeBlock) {
        inCodeBlock = false;
        flush();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      current.push({ line, lineNumber });
      continue;
    }

    if (line.trim() === "") {
      flush();
      continue;
    }

    current.push({ line, lineNumber });
  }
  flush();

  return blocks;
}

export function serializeBlocks(blocks: Block[], originalMarkdown?: string): string {
  if (!originalMarkdown) return blocks.map((b) => b.content).join("\n\n");
  return originalMarkdown;
}

export function replaceBlockContent(markdown: string, blockIdToReplace: string, content: string): string {
  const block = parseBlocks(markdown).find((b) => b.id === blockIdToReplace);
  if (!block) return markdown;
  return markdown.slice(0, block.startOffset) + content + markdown.slice(block.endOffset);
}

export function toggleTaskInBlock(markdown: string, blockIdToToggle: string, taskIndex: number): string {
  const block = parseBlocks(markdown).find((b) => b.id === blockIdToToggle);
  if (!block) return markdown;

  let seenTasks = 0;
  const lines = block.content.split("\n");
  const nextLines = lines.map((line) => {
    const match = line.match(/^(\s*[-*+]\s+\[)( |x|X)(\]\s+.*)$/);
    if (!match) return line;
    const currentTaskIndex = seenTasks;
    seenTasks += 1;
    if (currentTaskIndex !== taskIndex) return line;
    const nextMark = match[2].toLowerCase() === "x" ? " " : "x";
    return `${match[1]}${nextMark}${match[3]}`;
  });

  if (taskIndex < 0 || taskIndex >= seenTasks) return markdown;
  return replaceBlockContent(markdown, blockIdToToggle, nextLines.join("\n"));
}

export function getPreviewRatioForLine(blocks: Block[], line: number): number {
  if (blocks.length <= 1) return 0;
  const index = blocks.findIndex((block) => line >= block.startLine && line <= block.endLine);
  if (index >= 0) return index / (blocks.length - 1);
  const nextIndex = blocks.findIndex((block) => line < block.startLine);
  if (nextIndex >= 0) return nextIndex / (blocks.length - 1);
  return 1;
}

export function getLineForPreviewRatio(blocks: Block[], ratio: number): number {
  if (blocks.length === 0) return 0;
  const index = Math.min(blocks.length - 1, Math.max(0, Math.round(ratio * (blocks.length - 1))));
  return blocks[index].startLine;
}

// Auto-close brackets: returns closing char and new cursor position
export function autoCloseBracket(
  value: string,
  start: number,
  end: number,
  key: string,
): { newValue: string; cursor: number } | null {
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closing = pairs[key];
  if (!closing) return null;

  // If there's a selection, wrap it
  if (start !== end) {
    const sel = value.slice(start, end);
    return { newValue: value.slice(0, start) + key + sel + closing + value.slice(end), cursor: end + 2 };
  }

  // If next char is the closing bracket, just skip over it
  if (value[start] === closing) {
    return { newValue: value, cursor: start + 1 };
  }

  return { newValue: value.slice(0, start) + key + closing + value.slice(end), cursor: start + 1 };
}

// List continuation: returns what to insert after Enter
export function getListContinuation(line: string): { indent: string; prefix: string } | null {
  const taskMatch = line.match(/^(\s*)([-*+])\s\[([ x])\]\s/);
  if (taskMatch) {
    const indent = taskMatch[1];
    const marker = taskMatch[2];
    return { indent, prefix: `${marker} [ ] ` };
  }

  const orderedMatch = line.match(/^(\s*)(\d+)\.\s/);
  if (orderedMatch) {
    const indent = orderedMatch[1];
    const num = parseInt(orderedMatch[2], 10);
    const next = line.trim() === `${orderedMatch[2]}.` ? 0 : num + 1; // empty item closes list
    if (next === 0) return { indent: "", prefix: "\n" }; // remove empty list item
    return { indent, prefix: `${next}. ` };
  }

  const bulletMatch = line.match(/^(\s*)([-*+])\s/);
  if (bulletMatch) {
    const indent = bulletMatch[1];
    const marker = bulletMatch[2];
    const isEmpty = line.trim() === marker;
    if (isEmpty) return { indent: "", prefix: "\n" }; // remove empty list item
    return { indent, prefix: `${marker} ` };
  }

  return null;
}

export interface FormatResult {
  newValue: string;
  cursorStart: number;
  cursorEnd: number;
}

export function formatInsertion(syntax: string, val: string, start: number, end: number): FormatResult {
  const sel = val.slice(start, end);
  let newValue: string;
  let cursorStart: number;
  let cursorEnd: number;

  if (syntax === "bold") {
    if (sel) {
      newValue = val.slice(0, start) + `**${sel}**` + val.slice(end);
      cursorStart = cursorEnd = start + sel.length + 4;
    } else {
      newValue = val.slice(0, start) + "****" + val.slice(end);
      cursorStart = cursorEnd = start + 2;
    }
  } else if (syntax === "italic") {
    if (sel) {
      newValue = val.slice(0, start) + `*${sel}*` + val.slice(end);
      cursorStart = cursorEnd = start + sel.length + 2;
    } else {
      newValue = val.slice(0, start) + "**" + val.slice(end);
      cursorStart = cursorEnd = start + 1;
    }
  } else if (syntax === "heading") {
    newValue = val.slice(0, start) + "# " + val.slice(end);
    cursorStart = cursorEnd = start + 2;
  } else if (syntax === "link") {
    if (sel) {
      newValue = val.slice(0, start) + `[${sel}](url)` + val.slice(end);
      cursorStart = cursorEnd = start + sel.length + 7;
    } else {
      newValue = val.slice(0, start) + "[link text](url)" + val.slice(end);
      cursorStart = start + 1;
      cursorEnd = start + 10;
    }
  } else {
    return { newValue: val, cursorStart: start, cursorEnd: end };
  }

  return { newValue, cursorStart, cursorEnd };
}

export function getFileFormat(fileName: string | null | undefined): "MD" | "TXT" | null {
  if (!fileName) return null;
  return fileName.toLowerCase().endsWith(".txt") ? "TXT" : "MD";
}

export type DropFileType = "image" | "text" | null;

export function getDropFileType(fileName: string, mimeType: string): DropFileType {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  const imgExts = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp"];
  if (imgExts.includes(ext) || mimeType.startsWith("image/")) return "image";
  const textExts = [
    ".md",
    ".txt",
    ".markdown",
    ".mdown",
    ".html",
    ".json",
    ".csv",
    ".xml",
    ".yaml",
    ".yml",
    ".toml",
    ".env",
  ];
  if (textExts.includes(ext) || mimeType.startsWith("text/") || mimeType === "application/json") return "text";
  return null;
}

export function stripMarkdown(md: string): string {
  let text = md;
  // Remove code fences (```...```) — collapse to single newline
  text = text.replace(/\n?```[\s\S]*?```\n?/g, "\n");
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, "$1");
  // Remove images, keep alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Convert links to just text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, "");
  // Remove bold/italic markers
  text = text.replace(/\*\*(.+?)\*\*/g, "$1");
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text.replace(/__(.+?)__/g, "$1");
  text = text.replace(/_(.+?)_/g, "$1");
  // Remove strikethrough
  text = text.replace(/~~(.+?)~~/g, "$1");
  // Remove blockquote markers
  text = text.replace(/^>\s?/gm, "");
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");
  // Remove task markers BEFORE list markers (more specific first)
  text = text.replace(/^[\s]*[-*+]\s+\[[ x]\]\s+/gm, "");
  // Remove list markers (-, *, +, 1.)
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export const SAMPLE_MARKDOWN = `# Welcome to MD MA

A beautiful Markdown editor and viewer.

## ✨ Features

### Three View Modes

Switch between **Code**, **Preview**, and **Split** view modes using the toolbar.

- **Code** — write and edit raw Markdown
- **Preview** — see your document rendered with rich formatting
- **Split** — code on the left, live preview on the right, scroll-synced

### Syntax Highlighting

Code blocks with syntax highlighting for 20+ languages:

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

\`\`\`python
class MarkdownParser:
    def __init__(self, content: str):
        self.content = content

    def render(self) -> str:
        """Parse markdown content to HTML."""
        return self._parse(self.content)
\`\`\`

\`\`\`css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}
\`\`\`

### Tables

| Feature | Status | Description |
|---------|--------|-------------|
| Code Mode | ✅ | Raw markdown editing |
| Preview Mode | ✅ | Rendered output |
| Split View | ✅ | Side by side with scroll sync |
| Themes | ✅ | 4 themes available |
| Syntax Highlighting | ✅ | 20+ languages |
| Copy Rendered | ✅ | Rich text clipboard |

### Task Lists

- [x] Drag & drop file support
- [x] Syntax highlighting
- [x] Copy rendered markdown
- [x] Table of Contents
- [x] 4 beautiful themes
- [ ] PDF export
- [ ] Custom themes

### GitHub Callouts

> [!NOTE]
> This is a GitHub-style callout note. Great for highlighting important information.

> [!TIP]
> Drag and drop any \`.md\` or \`.txt\` file onto the editor to open it instantly!

> [!IMPORTANT]
> Key information that users should be aware of when using this editor.

> [!WARNING]
> Make sure to save your work before closing the browser tab.

> [!CAUTION]
> Be careful — destructive actions cannot be undone!

### Text Formatting

**Bold text**, *italic text*, ~~strikethrough~~, and \`inline code\`.

> Regular blockquotes work too — perfect for quoting documentation or other sources.

---

### Links & Images

Visit [GitHub](https://github.com) for more markdown resources.

### Ordered List

1. First item
2. Second item
3. Third item
   1. Nested item
   2. Another nested item

---

*Start editing or drop a file to begin!*
`;
