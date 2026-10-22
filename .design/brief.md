# Design Brief — MD MA (corrected)

## Product
Lokalny czytnik Markdown dla macOS (Tauri, React 19/Vite 7/TS), edycja opcjonalna. Dokument MD, renderowany podgląd, spis treści. Użytkownik: autor/notatnik/programista, w tym polski.

## Rejected direction (owner) — konkretne niespójności
Obecny styl odrzucony przez właściciela. Dowody to niespójności kodu, nie sam gust:
- `src/index.css:45-50` + `src/types.ts:479-488`: font-stack i FONT_SETS nie są spięte semantycznymi rolami UI/text/code; „Inter + JetBrains" to preset bez powodu produktu.
- `src/index.css:95-144`: skala nagłówków arbitralna (2.25/1.65/1.3/1.1/1/0.85em), wagi 650/700, h6 uppercase — brak rytmu i hierarchii.
- `src/index.css:152-166`: animowany podkreśl linku (gradient + background-size) — dekoracja bez roli.
- `src/index.css:225-230,263-273`: blok kodu radius 14px + box-shadow — karta bez potrzeby.
- `src/index.css:493-495,254-255,420-445`: glassmorphism (blur 24/8/6px) w toolbar/kopiowaniu/overlay — szum.
- `src/types.ts:21-397`: 16 motywów z nasyconymi akcentami — brak semantycznej pary jasny/ciemny.
- `src/components/CommandPalette.tsx:74`, `src/App.tsx:998,1093,1146`: `rounded-xl shadow-2xl` — karty/modale bez systemu.
Runtime nie zweryfikowano (brak GUI); to statyczna ocena.

## New direction (realnie inna kompozycja/typografia)
Jobs-owska prostota przez odejmowanie: jeden typograficzny głos, precyzyjne proporcje, brak dekoracji. Nie kopiujemy Apple. Typografia i miara zmieniają się realnie, nie deklaracją.

## Typography — dwie pary do porównania wizualnego (kandydaci, nie finalny wybór)
Para A (czytelnicza): system sans UI (SF/Segoe/system-ui) dla interfejsu + serif do czytania (New York/Iowan Old Style/Georgia, z pokryciem PL) dla treści MD.
Para B (jednolita): świadomie uzasadniony sans (system-ui stack) dla UI i tekstu.
Kod: system mono (SF Mono/Menlo/Consolas) w obu. Brak pobierania fontów/zależności. Wybór po renderze polskich tekstów.

Role: UI 13px/400-500/1.3; Text 16px/1.65; Code 13.5px/1.6, tab-size 2.

## Measure / rhythm / hierarchy
Rhythm bazowy 8px (8/16/24/32/48). Nagłówki: H1 1.75rem/1.15, H2 1.375rem/1.2, H3 1.125rem/1.3, H4 1rem/1.35, H5 0.9375rem, H6 0.8125rem. Wagi 600/500/400. Marginesy H: 2rem góra / 0.5rem dół. Brak border-bottom i uppercase. Komfortowa miara ~60-72ch domyślnie; konfigurowalna szeroka miara dla tabel/kodu/istniejącego szerokiego preview — nie blokować.

## Palette
2 dopracowane domyślne: jasny i ciemny, semantyczne role (canvas, surface, surface-2, text, text-2, muted, border, accent, accent-soft, danger, success), jeden stonowany akcent + miękkie tło, kontrast WCAG AA. Pozostałe 14 motywów i custom zachowane jako opcje zaawansowane (bez usuwania). local-first; zdalne obrazy tylko świadomie włączone.

## Views
Czytanie: tekst w measure, marginesy boczne, bez chrome wokół. Split: kod (mono) lewo / podgląd prawo, divider 1px, ratio w localStorage. Focus: ukryj toolbar/statusbar, powiększ padding (56px), brak glass/animacji wejścia.

## Discrete tools & states
Narzędzia subtelne: hover/focus (kopiuj kod), ikony 16px, bez pigułek. Stany: hover/active/focus-visible/disabled/loading/empty/error/success/selected. Focus-visible: 2px outline accent, offset 2px. Reduced motion respektowane.

## Cmd+F / ostatnie pliki / pamięć pozycji / ToC
Cmd+F: minimalny pasek z licznikiem i nawigacją (prev/next) — nie natywny find webview. Ostatnie pliki: lista w menu Plik/dropdown, bez nowego panelu. Pamięć pozycji: per tożsamość dokumentu + kotwica walidowana treścią (hash/linia), nie jeden globalny offset. ToC: istniejący sidebar, subtelny, Cmd+Shift+T toggle.

## Constraints
Zapis wyłącznie `.design/brief.md`. Brak zmian w src/CSS/config/deps. Brak builda/deployu/sekrety/innych agentów/płatnych modeli. GUI: znane odmowy OS Accessibility; brak zrzutów = brief statyczny, nie wizualny PASS.

## Wymaga wizualnego porównania
Para A vs B na polskich tekstach, tabelach, blokach kodu, w jasnym i ciemnym. Sprawdzić: diakrytyki, measure, rhythm, kontrast, focus-visible, reduced motion, 200% zoom, długie słowa. Bez nowych audytów.
