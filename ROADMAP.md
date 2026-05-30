# ROADMAP — MD MA

---

## 🟢 Do zrobienia

### 1. Notaryzacja macOS
Obecnie ad-hoc signed — dodać `APPLE_ID` + `APPLE_PASSWORD` do GitHub Secrets i notaryzację w `tauri.yml`.

### 2. Obrazki — lazy loading + zoom
Przy wielu obrazkach w dokumencie: lazy loading i kliknięcie powiększające.

### 3. Spellcheck w CodeEditor
Wbudowany spellcheck przeglądarki (`spellcheck` atrybut) — sprawdzić czy działa z contentEditable-fallback.

### 4. Skróty klawiszowe w Command Palette
Wyświetlać skróty obok komend w palecie (Cmd+S, Cmd+Z itp.).

---

## 📊 Statystyki (maj 2026)

| Metryka | Wartość |
|---|---|
| Pliki źródłowe | 14 (TSX/TS/CSS) |
| Linie kodu | ~3900 |
| Testy | 80 |
| Komponenty React | 9 |
| Motywy | 10 + custom + 6 community |
| Font sety | 8 |
| Skróty klawiszowe | 13 |
| Build (single‑file) | 649 kB |
| DMG | 3.3 MB (ad-hoc signed) |

---

## Decision log

| Decyzja | Uzasadnienie |
|---|---|
| Block editing over contentEditable | Zachowuje wierność markdown, czystsza architektura |
| Origin-tracking flags + block-based scroll sync | Całkowicie eliminuje feedback loop scrolla |
| System fonts | Mały binary, natywny wygląd, single‑file output |
| Tauri 2 over Electron | Mniejszy binary (~3.4 MB), natywne menu, ad-hoc signing |
| SettingsDialog as modal | Lepsze UX dla preview motywów i przełącznika języka |
| Preview debounce 200ms | ReactMarkdown jest ciężki — nie re-renderuje na każdym znaku |
| `previewBlocksRef` for scroll sync | Zapewnia zgodność bloków z DOM (który renderuje `previewMarkdown`) |
| Block-based scroll sync obu kierunków | Ratio-based powodował skoki przy różnej wysokości bloków |

Ostatnia aktualizacja: 30 maja 2026 (iteracja 9)