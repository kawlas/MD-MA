# Application State Log — MD MA

## Current State (2026-05-30)

### Build Status
- **Single-file build:** 648 kB HTML
- **macOS DMG:** 3.3 MB ad-hoc signed
- **Typecheck:** ✅ Clean (1 pre-existing warning)
- **Lint:** ✅ Clean (1 pre-existing warning)
- **Tests:** ✅ 80/80 passing

### Core Features
- Block-style editable preview (Notion-style)
- Focus mode with floating exit
- Command palette (Cmd+K) with 20 commands
- Resizable split view (15%-85%)
- Image paste/drop as base64

### Themes
**Premium (10):** Snow, Ivory, Navy, Midnight, Slate, Ocean, Storm, Twilight, Onyx, Sepia
**Community (6):** Nord, Tokyo Night, Solarized, GitHub Dark, Dracula, Gruvbox
**Custom:** Persisted in localStorage as JSON

### Fonts (8 Sets)
System, Inter+JetBrains, New York (Apple serif), SF Rounded, Helvetica Neue, Mono, Atkinson, IBM Plex

### i18n
- Languages: Polish, English
- Auto-detect from `navigator.language`
- 85+ UI strings translated

### Scroll Sync Architecture
- Origin-tracking flags: `editorScrollSuppressed.current` / `previewScrollSuppressed.current`
- Block-based position mapping with ratio fallback
- Re-sync via `useEffect` on `previewMarkdown` after 200ms debounce
- No time-based lock (fully eliminated feedback loop)

---
*Automatically generated state snapshot*

---

## Goal

Build a premium Markdown editor as a standalone macOS app with block-style editable preview, premium UI, and smooth editing experience.

## Constraints & Preferences

- App name "MD MA" (not "MD Editor")
- Editable preview: Notion-style block editing preserving markdown fidelity
- Full-width preview (no max-width constraint)
- Focus mode with floating exit button
- macOS binary (.dmg) via Tauri 2 with ad-hoc code signing
- TDD (red/green) – write test first, all checks before moving on
- macOS native menu bar with all keyboard shortcuts visible
- Settings as centered modal dialog (extracted from floating dropdown)
- Open/save both .md and .txt files; status bar shows "MD" or "TXT"
- Format insertion must read from DOM (ta.value), not stale React state
- "Must work like a razor" (żyleta) – UX performance is top priority
- "Prettier than Apple native" – UI must exceed Apple design standards
- i18n: Polish + English with automatic locale detection