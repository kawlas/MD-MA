# Osadzone kroje czcionek (OFL)

Lokalnie podłączone, w pełni offline fonty użyte przez zestawy `literata`, `sourceserif4`, `lora`, `atkinson`, `jetbrains-mono`.

## Pochodzenie

| Krój | Źródło | Licencja | Wariant |
|---|---|---|---|
| Literata | `google/fonts` repo, `ofl/literata/Literata[opsz,wght].ttf` (+ italic) | OFL | wght 400–700, opsz = 14 (świadomy kompromis wydania — bez automatycznego optical sizing) |
| Source Serif 4 | `google/fonts` repo, `ofl/sourceserif4/SourceSerif4[opsz,wght].ttf` (+ italic) | OFL | wght 400–700, opsz = 14 |
| Lora | `google/fonts` repo, `ofl/lora/Lora[wght].ttf` (+ italic) | OFL | wght 400–700 |
| Atkinson Hyperlegible | `google/fonts` repo, static TTFs (Regular/Bold/Italic/BoldItalic) | OFL | wght 400 / 700 (+ italics) |
| JetBrains Mono | `google/fonts` repo, `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` (+ italic) | OFL | wght 400–700 |

Pliki źródłowe `.ttf` nie trafiają do repo — wygenerowane `.woff2` są w `src/assets/fonts/*.woff2` po podzieleniu (subset) na zestaw `Latin-1 + Latin Extended-A (incl. polskie znaki) + interpunkcja + literały techniczne`.

### Kodowanie znaków

Subset obejmuje: ASCII (U+0020–007E), Latin-1 (U+00A0–00FF), Latin Extended-A (U+0100–017F — w tym polskie znaki ą ć ę ł ń ó ś ź ż), interpunkcję ogólną (U+2000–206F), waluetę, znaki techniczne (U+2200–22FF). Kursywa i pogrubienie (700) są prawdziwe (osadzone warianty variable/static), nie syntetyzowane.

## Konfiguracja runtime

- `@font-face` zamiast fontów zdalnych (`fonts.googleapis.com`) — `src/fonts.css` (`src/assets/fonts/*.woff2`).
- Brak zapytań sieciowych fontów: po buildzie jeden plik `dist/index.html` (vite-plugin-singlefile + `build.assetsInlineLimit` 4MB) z danymi w base64 (WOFF2) — działa offline.
- Fallbacki per rodzina: Literata → `Iowan Old Style`, Georgia, Times New Roman; Source Serif 4 → Georgia, Times New Roman; Lora → Georgia, Times New Roman; Atkinson Hyperlegible → system sans; JetBrains Mono → `SF Mono`, Menlo, Monaco, Consolas.

## Licencje

Każdy kroj ma własny plik OFL.txt w `src/assets/fonts/licenses/`. OFL jest licencją libre-fontów open-source — dozwolone jest użycie, modyfikacja i redistribucja z zachowaniem założeń OFL.

## Rozmiar

Suma subsetowanych WOFF2: ok. 549 KB surowych (~732 KB base64), w tym JetBrains Mono italic (114 KB, variable wght 400–700). Ostateczny artefakt: `dist/index.html` ~1,3 MB (build produkcyjny). Akceptowalny kompromis wydania zdecydowany przez radę (nie usuwamy kursyw, nie wyrzucamy fontów).
