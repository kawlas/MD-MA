# MD MA

A Markdown viewer and editor with live preview, multiple themes, and syntax highlighting.

- **Web version** — single HTML file (no server needed)
- **macOS app** — standalone `.dmg` / `.app` bundle

## Quick start

```sh
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # single static file → dist/index.html
npm run preview    # serve built file locally
```

## macOS app

Build a standalone `.app` / `.dmg`:

```sh
npm run build
npm run tauri build
```

The bundle lands at `src-tauri/target/release/bundle/dmg/`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (single HTML) |
| `npm run preview` | Serve built output |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (TSX + CSS) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest run |
| `npm run test:watch` | Vitest watch |
| `npm run tauri dev` | Tauri dev (opens native window) |
| `npm run tauri build` | Tauri release build (macOS .dmg) |

## Features

- **3 view modes**: Code, Preview, Split (scroll-synced)
- **16 built-in themes**: Snow, Ivory, Navy, Midnight, Slate, Ocean, Storm, Twilight, Onyx, Sepia, GitHub Dark, Nord, Tokyo Night, Solarized Light, Solarized Dark (cycle with `F5`)
- **Custom themes**: add JSON via toolbar gear icon
- **8 font sets**: System, Inter+JetBrains, New York, SF Rounded, Helvetica Neue, Mono, Atkinson, IBM Plex
- **File ops**: open `.md`/`.txt`, drag-and-drop (text & images), download
- **Export**: download as `.md`/`.txt`, copy as rich text (HTML clipboard), export PDF (print)
- **Undo/Redo**: 200-level history stack
- **i18n**: English & Polish (auto-detected)
- **Syntax highlighting**: 20+ languages via highlight.js (Catppuccin Mocha theme)
- **GFM**: tables, task lists, strikethrough, GitHub callouts, auto-link
- **Table of Contents**: collapsible sidebar with heading nav, scroll-synced
- **Focus mode**: clean writing environment, toolbar hidden
- **Command palette**: `Cmd+K` to search/filter commands
- **Settings panel**: floating panel (no overlay) — theme swatches, font selection, density controls, language
- **Scroll sync**: block-based bidirectional sync between editor and preview
- **Persistence**: content, theme, custom themes, font set, split ratio saved to `localStorage`

## Stack

React 19, Vite 7, Tailwind CSS 4, TypeScript 5.9, Tauri 2.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+S` | Download file |
| `Cmd/Ctrl+O` | Open file |
| `Cmd/Ctrl+N` | New file |
| `Cmd/Ctrl+Shift+C` | Copy rendered as rich text |
| `Cmd/Ctrl+Shift+P` | Export PDF |
| `F5` | Cycle theme |
