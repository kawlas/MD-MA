# MD MA — Agent Guide

## Stack

React 19 + Vite 7 + Tailwind CSS 4 + TypeScript 5.9.

## Commands

```sh
npm run dev           # dev server (Vite)
npm run build         # production build (outputs single HTML file via vite-plugin-singlefile)
npm run preview       # serve the built file locally
npm run lint          # ESLint (flat config: eslint.config.js)
npm run format        # Prettier (src/**/*.{ts,tsx,css})
npm run typecheck     # tsc --noEmit
npm run test          # Vitest run (config: vitest.config.ts)
npm run test:watch    # Vitest watch
npm run tauri dev     # Tauri dev (native window + Vite)
npm run tauri build   # Tauri release build → .dmg/.app
npm run tauri:dev     # alias for tauri dev
npm run tauri:build   # alias for tauri build
```

## Path alias

`@/` → `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Key architectural facts

- **Single-file output**: `vite-plugin-singlefile` inlines all JS/CSS into one HTML file — no code splitting, no dynamic imports.
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Components: `Toolbar`, `CodeEditor`, `Preview`, `TableOfContents`, `StatusBar`, `CommandPalette`, `SettingsDialog`, `PreviewComponents` — all under `src/components/`.
- `cn()` utility (`clsx` + `tailwind-merge`) exists at `src/utils/cn.ts` but is **not used** anywhere — components inline `className` strings directly.
- State is in `App.tsx` only (no store; `LocaleProvider` wraps the tree for i18n in addition to `StrictMode`).

## Persistence

All persistence is routed through `safeGetItem`/`safeSetItem` (see `src/utils/storage.ts`).
Reads happen on mount; writes happen via `useEffect` (content debounced 500 ms).

| localStorage key | Value |
|---|---|
| `md-editor-content` | Raw markdown string |
| `md-editor-theme` | Theme name string |
| `md-editor-custom-themes` | JSON: `Record<string, ThemeVars>` |
| `md-editor-font-set` | JSON: selected `FontSet` object |
| `md-editor-split-ratio` | Number (0–1) |
| `md-editor-font-size-delta` | Number (steps) |
| `md-editor-line-height-delta` | Number (steps) |
| `md-editor-locale` | `"en"` \| `"pl"` |

## Keyboard shortcuts (all in `App.tsx`)

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+S` | Save (native in-place save, or Save As fallback) |
| `Cmd/Ctrl+Shift+S` | Save As (native dialog) |
| `Cmd/Ctrl+O` | Open file |
| `Cmd/Ctrl+N` | New file |
| `Cmd/Ctrl+Shift+C` | Copy rendered as rich text |
| `Cmd/Ctrl+Shift+P` | Export PDF (triggers `window.print()`) |
| `Cmd/Ctrl+K` | Open command palette |
| `F5` | Cycle built-in theme (19 themes + `system` preference, cycled via `THEME_LIST`) |

## macOS binary (Tauri)

- Rust project in `src-tauri/`. Run `npm run tauri build` to produce a `.dmg` in `src-tauri/target/release/bundle/dmg/`.
- Tauri config in `src-tauri/tauri.conf.json` — sets window size (1200×800), app identifier, DMG target.
- Ad-hoc code signing via `"signingIdentity": "-"` in `tauri.conf.json`.
- No custom Rust commands / IPC — pure WebView wrapper (menu events relayed via `menu-event`).
- `tauri dev` runs the Vite dev server and opens a native window.

### macOS native menu bar (`src-tauri/src/lib.rs`)

| Menu | Items |
|---|---|
| **MD MA** | About MD MA, Hide MD MA (`Cmd+H`), Hide Others (`Cmd+Alt+H`), Show All, Quit (`Cmd+Q`) |
| **File** | New File (`Cmd+N`), Open File (`Cmd+O`), Save (`Cmd+S`), Save As (`Cmd+Shift+S`), Export PDF (`Cmd+Shift+P`), Copy as Rich Text (`Cmd+Shift+C`) |
| **Edit** | Undo (`Cmd+Z`), Redo (`Cmd+Shift+Z`), Cut (`Cmd+X`), Copy (`Cmd+C`), Paste (`Cmd+V`), Select All (`Cmd+A`) |
| **View** | Toggle Outline (`Cmd+Shift+T`), Toggle Focus Mode (`Cmd+Shift+F`) |
| **Window** | Minimize (`Cmd+M`), Zoom, Close Window (`Cmd+W`) |

All custom items relayed to frontend via `handle.emit("menu-event", id)`. Built-in items (Cut, Copy, Paste, Select All, Minimize, Quit) handled natively by Tauri.

## Key features added

- **Editable preview** — `EditablePreview.tsx` renders markdown as clickable blocks; click any block to edit it inline (Notion-style). Fully separate from the raw code editor.
- **Focus mode** — toggled via toolbar button; hides toolbar/statusbar, enlarges padding, clean writing environment.
- **20 built-in themes** — Snow, Ivory, Navy, Midnight, Slate, Ocean, Storm, Twilight, Onyx, Sepia, githubDark, nord, tokyoNight, solarizedLight, solarizedDark, paper, ink, neutralLight, neutralDark, plus custom themes. F5 cycles the full built-in list.
- **Copy button** on code blocks — appears on hover over `<pre>` blocks in the preview.
- **Animated link underlines** — CSS-only slide-in underline on hover.
- **Command palette** — `CommandPalette.tsx`, triggered via Cmd+K. Searches/filters commands with keyboard navigation.
- **Resizable split** — draggable divider (col-resize) in split mode, persists ratio to localStorage.
- **Image paste/drop** — paste images from clipboard (Cmd+V) or drag-drop image files; stored as base64 Data URL in markdown.
- **Smooth transitions** — panel entrance animations, overlay fades, focus mode transitions.
- **Preview debounce** — `previewMarkdown` state updated 200ms after last keystroke; ReactMarkdown not re-rendered on every char.
- **RAF scroll throttle** — scroll sync handlers throttled via `requestAnimationFrame`, one sync per frame.
- **Timeout sync lock** — replaces toggle mutex; 50ms lock prevents feedback loop between editor/preview scroll events.

## Notable quirks

- `eslint.config.js` uses the flat config format (ESLint 9).
- No CI configured; `tsc --noEmit` works manually.
- Tailwind v4: `@import "tailwindcss"` in CSS (no `tailwind.config.*`).
- All styling is in `src/index.css` using CSS custom properties (`--bg-primary`, `--accent`, etc.) defined in `src/types.ts` as theme objects.
- `rehype-highlight` for syntax highlighting (Catppuccin Mocha overrides in CSS).
- Git remote: `origin https://github.com/kawlas/MD-MA` (push/fetch).
