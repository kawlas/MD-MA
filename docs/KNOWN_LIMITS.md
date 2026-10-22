# Known limits — MD MA

## Native GUI (macOS) — UNVERIFIED

Native file open/save dialogs were **not verifiable** on this machine: macOS
Accessibility permissions are denied for the app process, and no permission
bypass was attempted. The Tauri backend commands (`open_file`, `save_file`,
`save_file_as`) are registered and wired in `src-tauri/src/lib.rs`, and the
command handlers have Rust unit tests covering atomic write and document
identity logic. The web fallback (Blob download) works without permissions.

What to verify manually (requires granting Accessibility permission):
- Cmd+O → native open dialog → file loads with correct path binding
- Cmd+S → in-place save to the authorized document path
- Cmd+Shift+S → Save As dialog → atomic write + path authorization
- New File → clears editor + preview buffers; Save falls back to Save As

## Persistence & storage

| Limitation | Note |
|---|---|
| `localStorage` failure | A persistent notice with Retry + Download appears. Editor buffer stays in React state. |
| Locale not routed through `safeSetItem` | `src/i18n.tsx` uses raw `localStorage` for `md-editor-locale` (wrapped in try/catch, but not classified). Pre-existing. |
| No recent-files list | Never implemented. |
| No live reload | If the source `.md` changes on disk after opening, the editor does not detect it. |

## Content & rendering

| Limitation | Note |
|---|---|
| Images inlined as base64 | Paste/drag-drop embeds a `data:` URI directly in the Markdown. The `.md` grows with every image; there is no external asset folder. |
| PDF export via Print dialog | <kbd>Cmd</kbd><kbd>+</kbd><kbd>Shift</kbd><kbd>+</kbd><kbd>P</kbd> → `window.print()` → “Save as PDF”. |
| Raw HTML handling | `ReactMarkdown` has `skipHtml` not set (defaults to `false`), which means raw HTML nodes in the markdown source are preserved as text nodes rather than rendered as live DOM. No `rehypeRaw` plugin is configured, so raw HTML is never executed — it is rendered as visible text. |
| CSP | `tauri.conf.json` sets `"csp": null` (no Content-Security-Policy). This is documented as-is; no false security claims. |

## Code signing

- Pre-release DMGs are **ad-hoc signed only** (`APPLE_SIGNING_IDENTITY='-'`).
- No Apple notarization. Production builds require a Developer ID + notarization.
- QA build uses a distinct bundle id (`com.mdeditor.md-ma-qa`) with no `.md`
  file associations, so it cannot overwrite a production install.

## Lint warnings (pre-existing)

19 warnings (0 errors), all pre-existing — no new warnings introduced on this
branch.
