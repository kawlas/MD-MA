# Embedded OFL Fonts

Locally bundled, fully offline fonts used by the `literata`, `sourceserif4`,
`lora`, `atkinson`, and `jetbrains-mono` font sets.

## Source

| Font | Source | License | Variant |
|---|---|---|---|
| Literata | `google/fonts` repo, `ofl/literata/Literata[opsz,wght].ttf` (+ italic) | OFL | wght 400–700, opsz = 14 |
| Source Serif 4 | `google/fonts` repo, `ofl/sourceserif4/SourceSerif4[opsz,wght].ttf` (+ italic) | OFL | wght 400–700, opsz = 14 |
| Lora | `google/fonts` repo, `ofl/lora/Lora[wght].ttf` (+ italic) | OFL | wght 400–700 |
| Atkinson Hyperlegible | `google/fonts` repo, static TTFs (Regular/Bold/Italic/BoldItalic) | OFL | wght 400 / 700 (+ italics) |
| JetBrains Mono | `google/fonts` repo, `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` (+ italic) | OFL | wght 400–700 |

Source `.ttf` files are not committed to the repo. Generated `.woff2` subsets
are in `src/assets/fonts/*.woff2`.

## Character set

Subsets cover: ASCII (U+0020–007E), Latin-1 (U+00A0–00FF), Latin Extended-A
(U+0100–017F — including Polish characters ą ć ę ł ń ó ś ź ż), general
punctuation (U+2000–206F), currency, and technical symbols (U+2200–22FF).
Italic and bold (700) are true font variants, not synthetic.

## Runtime configuration

- `@font-face` declarations in `src/fonts.css` (references
  `src/assets/fonts/*.woff2`).
- No network font requests: the build produces a single `dist/index.html`
  (`vite-plugin-singlefile` + `build.assetsInlineLimit: 4MB`) with WOFF2 data
  embedded as base64 — works offline.
- Fallback per family: Literata → `Iowan Old Style`, Georgia, Times New Roman;
  Source Serif 4 → Georgia, Times New Roman; Lora → Georgia, Times New Roman;
  Atkinson Hyperlegible → system sans; JetBrains Mono → `SF Mono`, Menlo,
  Monaco, Consolas.

## Licenses

Each font has its own OFL.txt file in `src/assets/fonts/licenses/`. OFL is an
open-source license permitting use, modification, and redistribution with
attribution.

## Size

Subsetted WOFF2 files total ~549 KB raw (~732 KB base64), including JetBrains
Mono italic (114 KB, variable wght 400–700). Final artifact: `dist/index.html`
~1.3 MB (production build). This is an acceptable trade-off — italics are not
dropped and no fonts are removed.
