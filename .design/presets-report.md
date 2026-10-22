# Design Partner Report — presets typograficzno-kolorystyczne (2026-10-22)

## Scope

- 4 nowe zestawy typograficzne: **Literata** (książkowy), **Source Serif 4** (neutralny), **Lora** (redakcyjny), **JetBrains Mono** (techniczny) + istniejący preset **Atkinson** (nazwa display: *Atkinson Hyperlegible*).
- 4 nowe palety: **paper**, **ink**, **neutralLight**, **neutralDark** (2 jasne / 2 ciemne).
- UI: rozszerzenie listy presetów o nowe zestawy/palety; brak nowych paneli, brak refaktoru.

## Fonty — dowód

| Kroj | Pochodzenie | Licencja | PL + kursywa/bold |
|---|---|---|---|
| Literata | `google/fonts` (`Literata[opsz,wght].ttf`) | OFL | mapa 333 znaków; ą ć ę ł ń ó ś ź ż w Latin Ext-A ✔ |
| Source Serif 4 | `google/fonts` (`SourceSerif4[opsz,wght].ttf`) | OFL | ten sam subset ✔ |
| Lora | `google/fonts` (`Lora[wght].ttf`) | OFL | ten sam subset ✔ |
| Atkinson Hyperlegible | `google/fonts` (static TTF) | OFL | ten sam subset ✔ |
| JetBrains Mono | `google/fonts` (`JetBrainsMono[wght].ttf`) | OFL | ten sam subset ✔ |

Subset: Latin-1 + Latin Ext-A (PL) + interpunkcja + techniczne. Wagi: variable wght 400–700 (Biblioteka `400 700` ⇒ realne 600/700) + warianty kursywne `italic` 400–700/osadzone. Nie użyto syntez — prawdziwe warianty.

Runtime: `@font-face` w `src/fonts.css` → `src/assets/fonts/*.woff2`; build single-file (`assetsInlineLimit` 4 MB) → dane base64 WOFF2 w `dist/index.html`; brak źródeł zdalnych dla fontów. Rozmiar: ~425 KB subsetów surowych, ~1,24 MB artefaktu po buildzie.

## Kontrast — wymiary

Metoda: WCAG 2.x relative luminance, `L = 0.2126R + 0.7152G + 0.0722B`; ratio = `(L1+0.05)/(L2+0.05)`.

Tabela: `nazwa/pary = ratio (wymaganie)`:

| Para | Wartość | Wymaganie |
|---|---|---|
| paper: text-primary/bg-primary | 15.32:1 | 4.5:1 ✔ |
| paper: text-secondary/bg-primary | 8.30:1 | 4.5:1 ✔ |
| paper: text-muted/bg-primary | 5.29:1 | 4.5:1 ✔ |
| paper: accent/bg-primary | 5.86:1 | 4.5:1 ✔ |
| paper: border-control/bg-primary | 3.78:1 | 3:1 ✔ |
| paper: code-text (`#cdd6f4`)/code-bg | 11.25:1 | 4.5:1 ✔ |
| … analogicznie dla ink, neutralLight, neutralDark — **32 asercji (8 przypadków × 4 palety), wszystkie ≥ wymagań** | | |

Wymagania CEO: tekst ≥ 4.5:1, kontrole ≥ 3:1, kod/tabele ≥ 3:1 — **zgodne (weryfikowane automatycznie). Focus nie jest testowany automatycznie.**

Obliczenia w kodzie: `src/types.test.ts` (`visual presets → WCAG AA`) — 8 testów automatycznych. Raport inżynieria: `.design/presets-report.md` + `src/assets/fonts/README.md`.

## Status

- typecheck ✔ / test 106/106 ✔ (98 theme+font+contrast, 8 App matchMedia listener) / build ✔ / lint: 0 errors (quality-lint fix 58d2c80 integrated, useLayoutEffect replaces refs-during-render).
- Brak http zdalnych @font-face; brak nowych npm deps; lock/Rust nietknięte.
