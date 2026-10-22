# Development — MD MA

## Prerequisites

- Node.js 22+
- npm (lockfile: `package-lock.json`)
- Rust 1.96.0 (stable, `aarch64-apple-darwin`)
- `cargo-tauri` 2.11.2
- Xcode Command Line Tools
- macOS 12.0+ (for native app)

## Install

```sh
npm ci
```

## Scripts

```sh
npm run dev          # Vite dev server (web-only, http://localhost:5173)
npm run build        # Single-file production build → dist/index.html
npm run preview      # Serve built output locally
npm run lint         # ESLint (flat config)
npm run format       # Prettier
npm run typecheck    # tsc --noEmit
npm run test         # Vitest run
npm run test:watch   # Vitest watch
npm run tauri dev    # Tauri dev (native window + Vite HMR)
npm run tauri build  # Tauri release build → DMG
npm run tauri:dev    # alias for tauri dev
npm run tauri:build  # alias for tauri build
```

The `tauri` npm scripts are thin aliases for `cargo tauri` — the project does
**not** install `@tauri-apps/cli`. Invoke `cargo tauri` directly if needed.

## Architecture

- **Entry:** `index.html` → `src/main.tsx` → `src/App.tsx`
- **State:** All in `App.tsx` (no store; `LocaleProvider` wraps the tree for i18n).
- **Single-file output:** `vite-plugin-singlefile` inlines all JS/CSS into one
  `dist/index.html` — no code splitting, no dynamic imports.
- **Path alias:** `@/` → `src/` (configured in `tsconfig.json` and `vite.config.ts`).
- **Styling:** Tailwind CSS v4 via `@import "tailwindcss"` in `src/index.css`.
  All colors are CSS custom properties (`--bg-primary`, `--accent`, etc.)
  defined per-theme in `src/types.ts` as `ThemeVars` records.
- **Syntax highlighting:** `rehype-highlight` with Catppuccin Mocha palette.
- **Fonts:** `@font-face` declarations in `src/fonts.css`. Five font sets ship
  embedded WOFF2 files (offline); the rest fall back to system fonts.
  `vite.config.ts` sets `assetsInlineLimit: 4MB` so fonts are base64-inlined
  into the single HTML output.

## Components

All under `src/components/`:

| Component | Responsibility |
|---|---|
| `Toolbar` | View mode, file actions, TOC toggle, focus mode, settings |
| `CodeEditor` | Textarea with line-number gutter, auto-close brackets, list continuation, image paste |
| `Preview` | `ReactMarkdown` + remark/rehype plugins, scroll-synced |
| `PreviewComponents` | Custom renderers: `CodeBlock` (copy button), `PreviewImage` (zoom), `headingComponent`, `blockquote` (callouts) |
| `TableOfContents` | Collapsible heading nav, active-item highlight |
| `StatusBar` | Word/line/char count, read time, file format |
| `CommandPalette` | Cmd+K command search with keyboard navigation |
| `SettingsDialog` | Floating panel: theme swatches, font sets, density, display, language |

## Tauri backend (`src-tauri/src/lib.rs`)

- **No custom Rust commands beyond file I/O.** Four `#[tauri::command]`
  functions: `open_file`, `save_file`, `save_file_as`, `clear_current_doc`.
- **Security model:** `save_file` writes only to the path previously authorized
  by `open_file` or `save_file_as` (stored in Tauri managed state
  `CurrentDoc`). The frontend never supplies a path. After New/import/drop,
  `clear_current_doc` invalidates the authorization — `save_file` then
  rejects and the frontend falls back to Save As.
- **Atomic writes:** unique temp file (nanosecond timestamp + xorshift suffix)
  via `create_new`, `sync_all`, then atomic `rename`. Permissions are
  preserved from the target. A failed write cleans up the temp file and never
  touches the target.
- **Menu:** macOS native menu bar (MD MA / File / Edit / View / Window).
  Custom items emitted as `menu-event` IPC to the frontend; built-in items
  (Cut, Copy, Paste, Select All, Minimize, Quit) handled natively.

## QA build (isolated identifier)

```sh
export CARGO_TARGET_DIR="$PWD/.cache/cargo"
export TAURI_TARGET_DIR="$PWD/.cache/tauri"
export APPLE_SIGNING_IDENTITY='-'
cargo tauri build --config "$PWD/.cache/qa-config.json"
```

The QA override (`productName: "MD MA QA"`, `identifier: "com.mdeditor.md-ma-qa"`,
no `.md` file associations) ensures the QA build can never overwrite a
production install. All temp/build output goes under `.cache/`.

## Testing

```sh
npm run test      # 150 tests (types, storage, i18n, App behavior)
npm run typecheck # tsc --noEmit
npm run lint      # ESLint
```

Rust tests (native file I/O, atomic write):

```sh
cargo test
```

## Cleanup

After building, remove `.cache/` and `dist/`:

```sh
rm -rf .cache/ dist/
```
