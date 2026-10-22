# CHANGELOG — MD MA

Wszystkie zmiany wg iterracji.

---

## Iteracja 1 — Fundament

**Co zrobiono:**
- Inicjalizacja projektu: Vite 7, React 19, Tailwind CSS 4, TypeScript 5.9
- `vite-plugin-singlefile` — cała aplikacja w jednym HTML
- ESLint flat config, Prettier, Vitest
- Podstawowe komponenty: `Toolbar`, `CodeEditor`, `Preview`, `EditablePreview`, `TableOfContents`, `StatusBar`
- Stan w `App.tsx` (bez store)
- Persistence przez localStorage: `md-editor-content`, `md-editor-theme`, `md-editor-custom-themes`
- 10 motywów: Snow, Ivory, Navy, Midnight, Slate, Ocean, Storm, Twilight, Onyx, Sepia
- PDF export przez `window.print()` + `Cmd/Ctrl+Shift+P`
- Skróty klawiszowe: Cmd+S, Cmd+O, Cmd+N, Cmd+Shift+P, Cmd+Shift+C, F5
- Tauri 2: macOS .dmg binary, 1200×800, `src-tauri/`
- ~~26 testów~~ → 26 testów: `slugify`, `extractToc`, `getStats`, `parseBlocks`, `serializeBlocks`

**Problemy wykryte później:** brak scroll synca, brak responsywności toolbara, brak natywnego menu.

---

## Iteracja 2 — Formatowanie + Fonty + Undo/Redo

**Co zrobiono:**
- 5 font setów (System, Developer, Serif, Minimal, Wide Read) + dialog fontów
- Przyciski formatowania (bold, italic, heading, link) — wstawiają składnię na kursorze
- Save As z `showSaveFilePicker` + fallback download
- Undo/Redo: 200-level history stack z debounce 400ms
- Font size +/- i line height +/- (persisted w localStorage)
- Reset font
- Auto-close brackets: `()`, `[]`, `{}` z selection wrapping
- Enter list continuation: `- `, `1. `, `- [ ] ` z usuwaniem pustych itemów
- Line numbers w CodeEditor (dynamic gutter, synced scroll)
- Inline file rename
- Scroll sync przez RAF

**Problemy:** scroll sync przez RAF nie działał, formatowanie wstawiało w złym miejscu (stale closure).

---

## Iteracja 3 — Fix scroll sync + Confirm dialog + Toolbar wrap + Gear icon

**Co zrobiono:**
- **Scroll sync**: RAF → mutex-based (direct `isSyncingRef` bez RAF, reset na triggered scroll)
- **New file confirm**: dialog Save/Discard/Cancel gdy `isModified || markdown.length > 0`
- **Toolbar wrap**: `flex-wrap: wrap` zamiast `flex-wrap: nowrap; overflow-x: auto` przy 900px
- **Gear icon**: usunięto przycisk "T" (font), theme `<select>`, custom themes — zastąpiono jedną ikoną gear
- **Settings panel**: modal z swatchami kolorów dla motywów, wyborem font setu, toggle focus mode
- **Badania**: `previewRef` nigdy nie był przekazany do `EditablePreview` → scroll sync nie działał w ogóle

**Problemy:** formatowanie dalej połykało tekst, toolbar dalej chował ikony, settings panel był modalem z szarą nakładką.

---

## Iteracja 4 — Kompletny fix formatowania + Toolbar + Scroll + PDF + .txt/.md + Menu

**Co zrobiono:**
1. **Format B/I/H/L** — `handleFormat` czytał `markdown` z React state (stale) → zmieniono na `ta.value` z DOM. Heading zmieniony z "zamień całą linię" na "wstaw # na kursor". Cursor position:
   - Bold no selection: `****`, kursor między `**|**`
   - Italic no selection: `**`, kursor między `*|*`
   - Heading: `# `, kursor po spacji
   - Link no selection: `[link text](url)`, zaznaczony "link text"
   - Ze selection: wrap, kursor na końcu

2. **Scroll sync** — dodano `ref={previewRef}` do `EditablePreview` w split i preview mode. Bez tego refa `previewRef.current` był zawsze `null`.

3. **Toolbar responsywność** — gap 2px (900px) / 1px (640px), padding zminimalizowany, SVG 14px przy 640px. `flex-wrap: wrap` na `toolbar-left`, `toolbar-center`, `toolbar-right`. Przy 480px ukrywane przyciski font/line height.

4. **PDF warning** — kontrola rozszerzenia przed otwarciem pliku, toast gdy .pdf.

5. **.txt ↔ .md interop** — dialog zapisu oferuje oba formaty (Markdown + Plain Text). StatusBar pokazuje "MD" lub "TXT".

6. **Natvne menu macOS** — File (New/Open/Save/Save As/Export PDF/Copy RTF/Quit), Edit (Undo/Redo/Cut/Copy/Paste/Select All), View (Toggle Outline/Toggle Focus Mode), Window (Minimize). Wszystkie skróty widoczne w pasku menu. Eventy wysyłane do frontendu przez `menu-event`.

**Testy:** 26 testów (bez zmian).

---

## Iteracja 5 — TDD + Dokumentacja

**Co zrobiono:**
- CHANGELOG.md
- ROADMAP.md z listą znanych problemów i planem napraw
- Ekstrakcja `formatInsertion()` do czystej funkcji w `types.ts`
- Testy dla `formatInsertion` (12 testów) — red-green-refactor
- Testy dla `getFormatLabel` (helper do wykrywania formatu pliku)
- Poprawiony scroll sync: zmiana z ratio-based na block-based
- Wszystkie testy przechodzą: 38 testów

---

## Iteracja 6 — Cmd+W + Toolbar <400px + .txt strip + final fixes

**Co zrobiono:**

1. **Cmd+W Close Window (macOS menu)**
   - Dodano `close_window` w `lib.rs` (`CmdOrCtrl+W` accelerator)
   - Frontend: `getCurrentWindow().close()` przez Tauri event

2. **Toolbar <400px**
   - Klasa `.hide-narrow` na logo, filename, PDF, Copy, Focus
   - Breakpoint ≤480px: `display: none !important`
   - Breakpoint ≤400px: gap 1px, min-height 36px, padding 2px

3. **.txt plain text conversion**
   - Czysta funkcja `stripMarkdown(md)` w `types.ts` (12 testów)
   - Użyta w `handleSaveAs` — przy .txt stripuje markdown, przy .md zachowuje

4. **Scroll sync — weryfikacja**
   - Potwierdzono działanie block-based mappingu (był już w iteracji 5)
   - `handleEditorScroll`: blok → DOM position → interpolacja w obrębie bloku
   - `handlePreviewScroll`: `data-source-start-line` → editor scrollTop

5. **Fix testu link cursor** — był off by 1 (cursorStart 17 → 18)

**Testy:** 63 (było 38) — +12 stripMarkdown + 12 formatInsertion + 1 fix

---

### Iteracja 6b — Fix app binary + menu macOS

**Co zrobiono:**

1. **Keyboard shortcuts — fix Shift+key**
   - `e.key` z Shift zwracało uppercase (`'P'` zamiast `'p'`)
   - Zmieniono na `e.key.toLowerCase()` dla wszystkich porównań
   - Dodano `return` po każdym handlerze (Cmd+Shift+Z wywoływało zarówno redo i undo)

2. **Ad-hoc code signing**
   - Dodano `"signingIdentity": "-"` w `tauri.conf.json`
   - Build log: "Signing with identity '-'" — app podpisana ad-hoc

3. **Menu macOS — pełna restrukturyzacja**
   - Dodano app menu "MD MA" (About, Hide Cmd+H, Hide Others, Show All, Quit)
   - Przeniesiono Quit z File do app menu
   - Dodano Zoom w Window menu
   - `.minimize()` z powrotem jako built-in (natywna obsługa macOS)
   - Wszystkie eventy relayowane do frontendu przez `menu-event`

**Build:** Ad-hoc signed .dmg → ~/Desktop

---

## Iteracja 7 — Scroll sync v2 + localStorage debounce + Drag-drop extend + Preferences dialog + i18n + CI/CD

**Co zrobiono:**

1. **Scroll sync v2 — origin-tracking flags**
   - Usunięto timestamp lock (50ms) → `editorScrollSuppressed.current` / `previewScrollSuppressed.current`
   - Flags ustawiane przed programowym `scrollTop`, sprawdzane na wejściu do skip echo events
   - Block lookup używa `previewBlocks` (ten sam source co rendered DOM)
   - `useEffect` na `previewMarkdown` re-sync po 200ms debounce window
   - Całkowicie eliminuje feedback loop (WebKit fire scroll event na `scrollTop` assignment)

2. **localStorage debounce (500ms)**
   - Czysta funkcja `debounce<T extends (...args: any[]) => void>(fn: T, delay: number): DebouncedFn<T>` w `types.ts`
   - 3 testy Vitest dla debounce

3. **Drag & drop extend**
   - `getDropFileType(fileName, mimeType) → 'image' | 'text' | null` w `types.ts`
   - Akceptowane rozszerzenia: .md, .txt, .markdown, .mdown, .html, .json, .csv, .xml, .yaml, .yml, .toml, .env
   - 9 testów Vitest

4. **Preferences dialog (SettingsDialog.tsx)**
   - Wyciągnięty z floating dropdown jako centered modal
   - Sekcje: Theme (swatches), Font, Density, Display, Language
   - Language switcher z integracją i18n
   - Focus mode toggle
   - Zamykanie ESC + backdrop click

5. **i18n (Polish + English)**
   - `src/i18n.ts`: `LocaleContext`, `LocaleProvider`, `useT()`, `useLocale()`, `t()`
   - Automatyczne wykrywanie z `navigator.language`
   - 85+ kluczy tłumaczeń EN/PL
   - 5 testów Vitest

6. **CI/CD GitHub Actions**
   - `.github/workflows/tauri.yml`
   - Trigger na tagi `v*`
   - macOS build, ad-hoc signing, upload .dmg jako artifact

**Testy:** 80 (63 + 3 debounce + 9 getDropFileType + 5 i18n)

**Build:** 637 kB single HTML file, typecheck/lint clean (1 pre-existing warning)

---

## Iteracja 8 — Final polish + DMG rebuild

**Co zrobiono:**
- CSS overhaul: modularna skala headingów (1.25×), animated link underlines (gradient slide-in), glassmorphism code copy button, pill badge języka kodu, thinner scrollbar (6px), refined tables/blockquotes/code blocks
- Full-width layout: usunięto `max-width: 800px` z preview, padding edytora 24px
- Font sets: 8 kompletnych (System, Inter+JetBrains, New York, SF Rounded, Helvetica Neue, Mono, Atkinson, IBM Plex)
- Themes: 10 premium + 6 community (Nord, Tokyo Night, Solarized, GitHub Dark, Dracula, Gruvbox)
- Smooth transitions: panelIn, overlayIn, toastIn/toastOut keyframes
- Responsive toolbar: breakpoint 900px, 640px, 480px; .hide-narrow przy ≤480px

**Build:** 648 kB single HTML, 3.3 MB DMG ad-hoc signed

---

## Iteracja 9 — Floating settings panel + Scroll sync refactor

**Co zrobiono:**

1. **SettingsDialog — floating panel**
   - Usunięto ciemny overlay (`rgba(0,0,0,0.5)`) i pozycjonowanie `fixed inset-0`
   - Panel unoszący się w prawym górnym rogu (`top: 50, right: 12, width: 400`)
   - Zmiana motywu widoczna natychmiast — panel nie blokuje widoku aplikacji

2. **Scroll sync — refaktoryzacja (App.tsx)**
   - Zastąpiono 2 flagi suppression (`editorScrollSuppressed` + `previewScrollSuppressed`) jednym timestamp lockiem (`scrollLockUntilRef`, 50ms mutex)
   - Zmergowano 2 RAF refy (`editorScrollRafRef` + `previewScrollRafRef`) w jeden (`scrollRafRef`)
   - Zmergowano 2 ref proxy (`editorScrollRef` + `previewScrollRef`) w jeden (`syncScrollRef`)
   - Zmergowano 2 handlery w jedną funkcję `syncScroll(source: 'editor' | 'preview')`
   - Dodano diff check do `setActiveHeadingId` — zapobiega zbędnym re-renderom

**Build:** 647 kB single HTML, 3.3 MB DMG ad-hoc signed

---

## Goal

Build a premium Markdown editor as a standalone macOS app with block-style editable preview, premium UI, and smooth editing experience.

---

## Current State

**Ready for release.** All features implemented, 80 tests passing, build stable.

### Status Overview
- ✅ Testy: 80/80 przechodzą
- ✅ Typecheck: czysty
- ✅ Lint: czysty (1 pre-existing warning)
- ✅ Build: 648 kB single HTML, 3.3 MB DMG ad-hoc signed
