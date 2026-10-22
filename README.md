# MD MA

A focused Markdown editor + live preview for macOS. Built with **React 19 + Vite 7 +
Tailwind CSS 4 + TypeScript** and packaged as a native desktop window via **Tauri 2**
(Rust). On build, Vite emits a single self‑contained HTML file
(`vite-plugin-singlefile`) that is bundled into the app — no dev server and no code
splitting at runtime.

> **Status: release candidate.** This README covers the
> `kawlas/final-closure` branch (tip `9b0693e`, parent `7536256`). It is a QA build,
> **ad‑hoc signed only** (no Apple notarization), and does **not** include
> Apple notarization. Treat it as a candidate for final review.

---

## Features

- **3 view modes**: Code, Preview, Split — scroll‑synced via block‑based sync with an
  `requestAnimationFrame` throttle and a 50 ms timeout lock to prevent feedback loops.
- **Editable preview** — rendered Markdown becomes clickable blocks; click any block to
  edit it inline (Notion‑style). Fully independent of the raw code editor.
- **19 built‑in themes** (Snow, Ivory, Navy, Midnight, Slate, Ocean, Storm, Twilight,
  Onyx, Sepia, `githubDark`, `nord`, `tokyoNight`, `solarizedLight`, `solarizedDark`,
  `paper`, `ink`, `neutralLight`, `neutralDark`) plus the live `system` OS preference —
  20 entries cycled by <kbd>F5</kbd>. Custom themes are also supported.
  `system` reacts live to the OS light/dark preference via `matchMedia`.
- **Command palette** — <kbd>Cmd</kbd><kbd>+</kbd><kbd>K</kbd>, with keyboard navigation
  and filtering.
- **Focus mode** — hides the toolbar/status bar and expands the editor.
- **12 font sets** with embedded OFL web‑fonts shipped as `woff2` for 5 presets
  (Literata, Source Serif 4, Lora, Atkinson Hyperlegible, JetBrains Mono) with
  license text.
- **Image paste & drop** — paste (<kbd>Cmd</kbd><kbd>+</kbd><kbd>V</kbd>) or drag‑drop
  an image file; it is stored **inline as a base64 `data:` URI** in the Markdown (no
  external asset files).
- **Syntax highlighting** via `rehype-highlight` (Catppuccin Mocha palette overrides
  in CSS) with a **Copy** button that appears on hover over `<pre>` blocks.
- **Link styling** — accent-colored links with hover state change.
- **Table of Contents** — collapsible sidebar, heading navigation, scroll‑synced.
- **File ops** — open `.md`/`.txt` (via a hidden `<input type="file">`), drag‑and‑drop
  text & images, and **download** the document.
- **Export** — download as `.md`/`.txt`, copy as rich text (HTML clipboard), export PDF
  (system Print → “Save as PDF”).
- **Undo/Redo** (native Edit menu: <kbd>Cmd</kbd><kbd>+</kbd><kbd>Z</kbd> /
  <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>Z</kbd>).
- **Persistence** — content, theme, custom themes, font set, split ratio, font size,
  line height, and locale are saved to `localStorage`.

---

## Install

### macOS app

Download a release DMG from [GitHub Releases](https://github.com/kawlas/MD-MA/releases) and open it:

1. `MD.MA.QA_0.1.0_aarch64.dmg` → open, then drag **MD MA** to `Applications`.
2. Launch from `Launchpad` / `Applications`, or run directly from the mounted DMG.

Pre-built QA DMGs are in [`artifacts/`](artifacts/). Verify the checksum:

```sh
cd artifacts/v0.1.0-rc.1
shasum -c SHA256SUMS.txt
```

### QA build identity (this branch)

This branch was validated with a **QA build** that uses a **distinct bundle
identifier and claims no file associations**, so it can never overwrite a production
install of `MD MA` and never touches existing `.md` associations:

| QA asset | Value |
|---|---|
| Display name | `MD MA QA` |
| Bundle identifier | `com.mdeditor.md-ma-qa` |
| Code signing | ad‑hoc (`APPLE_SIGNING_IDENTITY='-'`) |
| `CFBundleDocumentTypes` | absent (no `.md` claim) |
| Executable | `md-ma` (`LSMinimumSystemVersion` 12.0) |
| Version | `0.1.0` (`CFBundleVersion` / `ShortVersionString`) |

The production `src-tauri/tauri.conf.json` is **untouched** in this branch
(identifier `com.mdeditor.md-editor`, name `MD MA`, `.md` associations intact).
QA builds are produced via a `.cache/qa-config.json` override — see
[Build from source › QA build](#qa-build-ad-hoc).

---

## Quick start

```sh
npm install
npm run dev        # dev server at http://localhost:5173 (web-only)
npm run build      # single static file → dist/index.html
npm run preview    # serve built output locally
```

## Run

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server (web-only) |
| `npm run tauri dev` | Tauri dev (opens native window + Vite HMR) |
| `npm run preview` | Serve the built single file locally |
| `npm run build` | Production single‑file build (`dist/index.html`) |

> The `tauri` npm scripts are thin aliases for `cargo tauri` — the project does
> **not** install `@tauri-apps/cli`. Invoke `cargo tauri` directly if needed.

---

## Build from source

### Release DMG (ad‑hoc signed)

```sh
npm install
npm run tauri build   # == cargo tauri build; emits dist/ then bundles app + DMG
```

Output (default target dir): `src-tauri/target/release/bundle/dmg/MD MA_0.1.0_aarch64.dmg`

### QA build (ad‑hoc, isolated identifier)

The QA override config is written to `.cache/qa-config.json` inside the
project tree (not in `/tmp`):

```json
{ "productName": "MD MA QA", "identifier": "com.mdeditor.md-ma-qa", "bundle": { "fileAssociations": [] } }
```

Build with temp/build dirs under the project `.cache/`:

```sh
export CARGO_TARGET_DIR="$PWD/.cache/cargo"
export TAURI_TARGET_DIR="$PWD/.cache/tauri"
export APPLE_SIGNING_IDENTITY='-'
cargo tauri build --config "$PWD/.cache/qa-config.json"
```

Artifacts (Apple Silicon, `aarch64-apple-darwin`, rustc/cargo 1.96.0,
`cargo-tauri` 2.11.2):

```
.cache/tauri/release/md-ma                            # built binary
.cache/tauri/release/bundle/macos/MD MA QA.app        # app (cleaned after DMG creation)
.cache/tauri/release/bundle/dmg/MD MA QA_0.1.0_aarch64.dmg  # distributable DMG
```

### Production signing & notarization

Production DMGs need a Developer ID signing identity and Apple notarization. The CI
workflow [`.github/workflows/tauri.yml`](.github/workflows/tauri.yml) performs an
ad‑hoc build and runs notarization **only** on `v*` tag pushes (or on a manual
`workflow_dispatch` with `notarize: true`), and only when the Apple secrets are
present. **A manual dispatch never publishes a GitHub Release** — it only uploads
the DMG as a build artifact.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>S</kbd> | Save (native in-place save, or Save As dialog for new docs) |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>O</kbd> | Open file |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>N</kbd> | New file |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>C</kbd> | Copy rendered output as rich text (HTML + plain) |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>P</kbd> | Export PDF (triggers `window.print()`) |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>K</kbd> | Open command palette |
| <kbd>F5</kbd> | Cycle built‑in themes (19 + `system` = 20) |

### macOS menu bar

- **MD MA** — About, Hide / Hide Others / Show All, Quit.
- **File** — New File, Open File, Save, Save As, Export PDF, Copy as Rich Text.
- **Edit** — Undo, Redo, Cut, Copy, Paste, Select All.
- **View** — Toggle Outline, Toggle Focus Mode.
- **Window** — Minimize, Zoom, Close Window.

Custom File/Edit/View/Window items are relayed to the frontend as `menu-event` IPC
events; built‑in editing/window commands are handled natively by Tauri.

---

## Themes

`THEME_LIST` is defined once in [`src/types.ts`](src/types.ts) and cycled by `F5`.
Custom themes are saved to `localStorage` under `md-editor-custom-themes` as a
`Record<string, ThemeVars>` and persist across restarts. Theme variables
(e.g. `--bg-primary`, `--accent`, …) live entirely in CSS custom properties — there
is no `tailwind.config.*`; Tailwind v4 is consumed via `@import "tailwindcss"` in
[`src/index.css`](src/index.css).

---

## Limitations — Save behavior

> **Updated for native file I/O (commit `795d401`).** The macOS app now performs
> real in‑place Save and Save As via a Tauri backend (`tauri-plugin-dialog`).

1. **Save writes to the current document.** <kbd>Cmd</kbd><kbd>+</kbd><kbd>S</kbd>,
   the *File → Save* menu item, and the `save` menu event call `handleSave`
   (see [`src/App.tsx`](src/App.tsx)). In the native Tauri app this invokes the
   `save_file` backend command, which writes to the **authorized current document
   path** (set when you opened the file). If no document is open yet, it falls back
   to **Save As**.
2. **Save As opens the native dialog.** <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>S</kbd>,
   the *File → Save As* menu item, and the `save_as` menu event call `handleSaveAs`,
   which invokes the `save_file_as` backend command. The user picks a path via the
   OS save panel; the file is written **atomically** (unique temp file + rename) and
   becomes the new current document.
3. **No Native File System API in the web build.** Outside Tauri (e.g. `npm run preview`),
   `handleSave` and `handleSaveAs` fall back to a **Blob download** to your `Downloads`
   folder. There is no save-in-place on the web — this is a native-app feature.
4. **Security model.** The frontend never supplies a file path to the backend. `save_file`
   writes only to the path previously authorized by `open_file` or `save_file_as`.
   A failed write leaves the existing file untouched (atomic rename semantics).
5. **Content auto‑persists to `localStorage`.** The raw Markdown is saved (debounced
   500 ms) under `localstorage['md-editor-content']`, so the last document and cursor
   state survive app restarts. Font set, split ratio, font size, line height, locale
   (EN/PL) and custom themes are persisted the same way. If `localStorage` is
   unavailable (quota, security, or private mode), a **persistent recovery notice**
   appears with a Retry button and a Download fallback — the in-memory editor buffer
   is never lost (see [`src/utils/storage.ts`](src/utils/storage.ts)).
6. **Per‑app isolation.** Because persistence lives in each app's own `localStorage`,
   the **QA build** (`com.mdeditor.md-ma-qa` / "MD MA QA") and the **production build**
   (`com.mdeditor.md-editor` / "MD MA") keep **separate** content and settings — saved
   text and themes do not cross between them.
7. **No recent‑files list** and **no live reload** if the source `.md` changes on disk
   after opening.
8. **Images are inlined as base64.** Pasting/drag‑dropping an image embeds a `data:`
   URI directly in the Markdown, so the `.md` grows with every image and there is no
   external asset folder to manage.
9. **Export to PDF** is delegated to the OS Print dialog (<kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>P</kbd> → `window.print()` → “Save as PDF”).

---

## QA & validation

Release-specific evidence (branch tip, toolchain, DMG checksums, lint/test
counts) lives in [`docs/RELEASE.md`](docs/RELEASE.md) and is updated per
build. This README describes current behavior and known limits only.

## Known limits

See [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) for full user documentation and
[`docs/KNOWN_LIMITS.md`](docs/KNOWN_LIMITS.md) for the curated list of
confirmed limitations. Key items:

- **Native file dialogs** — open/save dialogs require macOS Accessibility
  permissions. On this machine they were **UNVERIFIED** (permission denied);
  no bypass was attempted. Web fallback (Blob download) works without
  permissions.
- **No recent-files list** and **no live reload** if the source `.md` changes
  on disk after opening.
- **Images are inlined as base64** — pasting/drag-dropping an image embeds a
  `data:` URI directly in the Markdown, so the `.md` grows with every image.
- **Export to PDF** is delegated to the OS Print dialog
  (<kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>P</kbd> → `window.print()` → “Save as PDF”).
- **Code signing** is ad‑hoc only (no Apple notarization) on pre-release builds.

## Development

See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for build, test, lint, and
Tauri packaging instructions.

---

## Stack

React 19, Vite 7, Tailwind CSS 4, TypeScript 5.9, Tauri 2, `rehype-highlight`
(Catppuccin Mocha). Frontend state lives entirely in `App.tsx`; there is no store
or context providers beyond `React.StrictMode`.

---

## License

This repository does **not** ship a LICENSE file and `package.json` declares no
license. Use, modify, and redistribute at your own discretion and in compliance
with third‑party licenses (React, Vite, Tauri, Tailwind, the embedded OFL web‑fonts).
A license file should be chosen and added before any public redistribution.
