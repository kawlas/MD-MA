# ROADMAP — MD MA

Znane problemy i plan napraw.

---

## ✅ Naprawione

### 1. Scroll sync nierównomierny (split view)
**Fix:** Block-based position mapping zamiast ratio. Edytor → preview: znajduje blok (`parseBlocks`) na pozycji scrolla, interpoluje pozycję w obrębie bloku używając rzeczywistej wysokości DOM. Preview → editor: znajduje blok na górze widoku (`data-source-start-line`), ustawia `scrollTop` na linię startową.

### 2. Toolbar — przy <400px
**Fix:** Klasa `.hide-narrow` na logo, filename, PDF, Copy, Focus. `display: none !important` przy ≤480px. Dodatkowy breakpoint ≤400px: `gap: 1px`, `min-height: 36px`, padding 2px na przyciskach.

### 3. Formatowanie — testy dla `formatInsertion`
**Fix:** Czysta funkcja `formatInsertion(syntax, val, start, end)` w `types.ts`. 12 testów: 4 syntax × (no selection / with selection), w tym poprawiony cursor dla link (był off by 1).

### 4. macOS Menu — Cmd+W Close Window
**Fix:** Dodano `close_window` w Rust (`MenuItemBuilder` z `CmdOrCtrl+W`), relay do frontendu przez `menu-event`. Frontend: `getCurrentWindow().close()`.

### 5. .txt/.md interop — konwersja na plain text
**Fix:** Czysta funkcja `stripMarkdown(md)` w `types.ts` (12 testów). Użyta w `handleSaveAs` — przy zapisie jako .txt treść jest stripowana z markdown.

---

## 🟡 Do zrobienia (średnie)

### 6. Automatyczne odświeżanie localStorage
**Problem:** Przy szybkim pisaniu `setMarkdown` + `localStorage.setItem` na każdej zmianie może być nieefektywne. Plan: dodać debounce na zapis do localStorage.

### 7. Drag & drop zewnętrznych plików  
**Problem:** Działa tylko dla .md i .txt. Można dodać obsługę .html, .json, .csv.

### 8. i18n
**Problem:** Cały UI po angielsku. Dodać polski i inne języki?

### 9. CI/CD dla Tauri
**Problem:** Tauri build tylko lokalnie. Dodać GitHub Actions dla macOS build.

### 10. Preferences dialog
**Problem:** Brak dedykowanego okna preferencji. Obecnie wszystko jest w settings panelu (gear).

---

## 🟢 Kosmetyczne / Future

### 6. Automatyczne odświeżanie localStorage
Problem: Przy szybkim pisaniu `setMarkdown` + `localStorage.setItem` na każdej zmianie może być nieefektywne. Plan: dodać debounce na zapis do localStorage.

### 7. Drag & drop zewnętrznych plików  
Problem: Działa tylko dla .md i .txt. Można dodać obsługę .html, .json, .csv.

### 8. i18n
Problem: Cały UI po angielsku. Dodać polski i inne języki?

### 9. CI/CD dla Tauri
Problem: Tauri build tylko lokalnie. Dodać GitHub Actions dla macOS build.

### 10. Preferences dialog
Problem: Brak dedykowanego okna preferencji. Obecnie wszystko jest w settings panelu (gear).

---

## 📊 Statystyki (maj 2026)

| Metryka | Wartość |
|---|---|
| Pliki źródłowe | 12 (TSX/TS/CSS) |
| Linie kodu | ~3648 |
| Testy | 63 |
| Komponenty React | 7 |
| Motywy | 10 + custom |
| Font sety | 5 |
| Skróty klawiszowe | 10 |

---

Ostatnia aktualizacja: 30 maja 2026 (iteracja 6)
