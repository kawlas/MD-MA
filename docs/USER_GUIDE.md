# User guide — MD MA

## Getting started

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server (web-only) |
| `npm run tauri dev` | Tauri dev (opens native window + Vite HMR) |
| `npm run preview` | Serve the built single file locally |
| `npm run build` | Production single-file build (`dist/index.html`) |

## View modes

- **Code** — raw Markdown editing with line numbers and gutter scroll sync.
- **Preview** — rendered Markdown as a reading pane.
- **Split** — editor on the left, live preview on the right. Scroll-synced
  via block-based mapping with a 50 ms timeout lock to prevent feedback loops.
  The divider is draggable (15%–85%) and the ratio persists to localStorage.

## Themes

Press <kbd>F5</kbd> to cycle through 19 built-in themes plus the `system`
preference (20 entries total):

Snow, Ivory, Navy, Midnight, Slate, Ocean, Storm, Twilight, Onyx, Sepia,
`githubDark`, `nord`, `tokyoNight`, `solarizedLight`, `solarizedDark`,
`paper`, `ink`, `neutralLight`, `neutralDark`, `system`.

Custom themes can be created in the Settings dialog (gear icon or
<kbd>Cmd</kbd><kbd>+</kbd><kbd>K</kbd> → Settings). They are saved to
`localStorage` under `md-editor-custom-themes` as a
`Record<string, ThemeVars>`.

When `system` is selected, the app reacts live to the OS light/dark preference
via `matchMedia("(prefers-color-scheme: dark)")`.

## Command palette

<kbd>Cmd</kbd><kbd>+</kbd><kbd>K</kbd> to open. Filter by typing; navigate with
arrow keys; <kbd>Enter</kbd> to execute. Commands cover view modes, file ops,
export, edit, font, and app actions.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>S</kbd> | Save (native in-place save, or Save As fallback) |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>S</kbd> | Save As (native dialog) |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>O</kbd> | Open file |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>N</kbd> | New file |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>C</kbd> | Copy rendered output as rich text (HTML + plain) |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>P</kbd> | Export PDF (triggers `window.print()`) |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>K</kbd> | Open command palette |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Z</kbd> | Undo |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>Z</kbd> | Redo |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>T</kbd> | Toggle Table of Contents outline |
| <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>F</kbd> | Toggle focus mode |
| <kbd>F5</kbd> | Cycle built-in themes (20 + `system`) |

### macOS menu bar

- **MD MA** — About, Hide / Hide Others / Show All, Quit.
- **File** — New File, Open File, Save, Save As, Export PDF, Copy as Rich Text.
- **Edit** — Undo, Redo, Cut, Copy, Paste, Select All.
- **View** — Toggle Outline, Toggle Focus Mode.
- **Window** — Minimize, Zoom, Close Window.

Custom File/Edit/View/Window items are relayed to the frontend as `menu-event`
IPC events; built-in editing/window commands are handled natively by Tauri.

## Fonts

12 font sets are available in Settings:

| Set | Body | Code | Notes |
|---|---|---|---|
| System | SF Pro Text | SF Mono | Native macOS |
| Inter + JetBrains | Inter | JetBrains Mono | |
| New York | New York | SF Mono | Apple serif |
| SF Rounded | SF Pro Rounded | SF Mono | |
| Helvetica Neue | Helvetica Neue | SF Mono | |
| Mono | SF Mono / JetBrains | Same | |
| Atkinson | Atkinson Hyperlegible | JetBrains Mono | High legibility |
| IBM Plex | IBM Plex Sans | IBM Plex Mono | |
| Literata | Literata | JetBrains Mono | Embedded OFL |
| Source Serif 4 | Source Serif 4 | JetBrains Mono | Embedded OFL |
| Lora | Lora | JetBrains Mono | Embedded OFL |
| JetBrains Mono | JetBrains Mono | JetBrains Mono | Embedded OFL |

Five font sets ship embedded WOFF2 fonts (Atkinson, Literata, Source Serif 4,
Lora, JetBrains Mono) — see [`src/assets/fonts/README.md`](src/assets/fonts/README.md)
for license details. The rest fall back to system fonts.

Font size, line height, and density can be adjusted in Settings and persist
to `localStorage` (`md-editor-font-size-delta`, `md-editor-line-height-delta`).

## File operations

- **Open** <kbd>Cmd</kbd><kbd>+</kbd><kbd>O</kbd> or drag-and-drop a `.md`/`.txt`
  file onto the editor.
- **Save** <kbd>Cmd</kbd><kbd>+</kbd><kbd>S</kbd> writes to the current
  document path (native) or triggers a Blob download (web).
- **Save As** <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>S</kbd>
  opens a native dialog; the file is written atomically (unique temp file +
  rename) and becomes the new current document.
- **New File** <kbd>Cmd</kbd><kbd>+</kbd><kbd>N</kbd> clears the editor. If the
  current document has unsaved changes, a confirm dialog (Save / Discard / Cancel)
  appears.
- **Export PDF** <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>P</kbd>
  opens the system Print dialog → “Save as PDF”.
- **Copy as Rich Text** <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>C</kbd>
  copies the rendered preview as HTML + plain text to the clipboard.

## Image handling

Paste (<kbd>Cmd</kbd><kbd>+</kbd><kbd>V</kbd>) or drag-drop an image file; it is
stored inline as a base64 `data:` URI in the Markdown. Click an image in
Preview to toggle zoom.

## Code blocks

Hover over a `<pre>` block to reveal a Copy button. Syntax highlighting
uses `rehype-highlight` with Catppuccin Mocha palette overrides in CSS.
Supports 20+ languages.

## Focus mode

Toggles via the toolbar button or <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>F</kbd>.
Hides the toolbar and status bar and expands the editor padding. Exit via the
floating button in the top-right or the same shortcut.

## Table of Contents

<kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>T</kbd> to toggle.
Shows all headings; the active section is highlighted as you scroll.
