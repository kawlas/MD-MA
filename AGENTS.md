# MD Editor — Agent Guide

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
```

## Path alias

`@/` → `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Key architectural facts

- **Single-file output**: `vite-plugin-singlefile` inlines all JS/CSS into one HTML file — no code splitting, no dynamic imports.
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Components: `Toolbar`, `CodeEditor`, `Preview`, `TableOfContents`, `StatusBar` — all under `src/components/`.
- `cn()` utility (`clsx` + `tailwind-merge`) exists at `src/utils/cn.ts` but is **not used** anywhere — components inline `className` strings directly.
- State is in `App.tsx` only (no store, no context providers beyond `StrictMode`).

## Persistence

| localStorage key | Value |
|---|---|
| `md-editor-content` | Raw markdown string |
| `md-editor-theme` | Theme name string |
| `md-editor-custom-themes` | JSON: `Record<string, ThemeVars>` |

All read on mount and persisted via `useEffect`.

## Keyboard shortcuts (all in `App.tsx`)

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+S` | Download file |
| `Cmd/Ctrl+O` | Open file |
| `Cmd/Ctrl+N` | New file |
| `Cmd/Ctrl+Shift+C` | Copy rendered as rich text |
| `Cmd/Ctrl+Shift+P` | Export PDF (triggers `window.print()`) |
| `F5` | Cycle built-in theme (system→sepia→nord→solarized→system) |

## macOS binary (Tauri)

- Rust project in `src-tauri/`. Run `npm run tauri build` to produce a `.dmg` in `src-tauri/target/release/bundle/dmg/`.
- Tauri config in `src-tauri/tauri.conf.json` — sets window size (1200×800), app identifier, DMG target.
- No custom Rust commands / IPC — pure WebView wrapper.
- `tauri dev` runs the Vite dev server and opens a native window.

## Notable quirks

- `eslint.config.js` uses the flat config format (ESLint 9).
- No CI configured; `tsc --noEmit` works manually.
- Tailwind v4: `@import "tailwindcss"` in CSS (no `tailwind.config.*`).
- All styling is in `src/index.css` using CSS custom properties (`--bg-primary`, `--accent`, etc.) defined in `src/types.ts` as theme objects.
- `rehype-highlight` for syntax highlighting (Catppuccin Mocha overrides in CSS).
- No git remote configured.
