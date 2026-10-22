# Release — MD MA

## Current build status

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ clean |
| ESLint | 🟡 0 errors, 19 pre-existing warnings |
| Vitest | ✅ 150/150 passing |
| `npm run build` | ✅ `dist/index.html` (single self-contained file) |

## Release candidate v0.1.0-rc.1

**Source SHA:** `7536256eae9b17be333fef67ddc6f78d202ba3ec` (public prerelease on GitHub)

The rc1 DMG + SHA256 were preserved at `artifacts/v0.1.0-rc.1/`. This source tag
is **superseded** by `kawlas/final-closure` after review passes; the rc1 local
binary is no longer shipped in this checkout (removed in favor of the single
rc2 installer in `instalka/`). Its SHA256 is recorded below for historical
reference only.

### rc1 artifact (historical)

| File | Path | SHA256 |
|---|---|---|
| DMG | `artifacts/v0.1.0-rc.1/MD.MA.QA_0.1.0_aarch64.dmg` (removed) | `5453b8ea06cabb6925309069a09eeaaf5587689e7e6c19b1d5cb6c6237c633c8` |

### rc1 validation evidence

| Item | Evidence |
|---|---|
| Toolchain | rustc/cargo 1.96.0, `cargo-tauri` 2.11.2, `RUSTUP_TOOLCHAIN=stable-aarch64-apple-darwin`, Xcode CLT |
| QA build | `cargo tauri build --config .cache/qa-config.json`, `APPLE_SIGNING_IDENTITY='-'` |
| `codesign --verify --deep --strict` | valid on disk / satisfies its Designated Requirement |
| Bundle id / signature | `com.mdeditor.md-ma-qa`, ad‑hoc (`TeamIdentifier` not set) |
| File associations | none (no `.md` claim) |
| DMG integrity | `hdiutil verify` → checksum **VALID** (UDZO / zlib, CRC32) |
| Launch test | `md-ma` process started, stayed alive, logged only a non‑fatal sandbox warning, then quit cleanly via SIGTERM — no crash |
| Production config | `src-tauri/tauri.conf.json` untouched: `com.mdeditor.md-editor` / "MD MA" / `.md` associations intact |
| Native GUI open/save | **UNVERIFIED** — macOS Accessibility permission denied |

## rc2 candidate (kawlas/final-closure)

**Source SHA:** `87724dc` — built and verified.

| File | Path | SHA256 | Size |
|---|---|---|---|
| DMG | `instalka/MD.MA.QA_0.1.0_aarch64.dmg` | `e643173a60b0916fc015e6da9d0653349b5854e51ed3ce3a32872fdb90889dc4` | 3.82 MB |

### rc2 verification

| Item | Evidence |
|---|---|
| Build | `cargo tauri build --config .cache/qa-config.json`, `APPLE_SIGNING_IDENTITY='-'` |
| `codesign --verify --deep --strict` (app inside DMG) | valid (exit 0) |
| Bundle id | `com.mdeditor.md-ma-qa` (ad‑hoc, no TeamIdentifier) |
| File associations | none (no `.md` claim) |
| `hdiutil verify` (DMG) | VALID (UDZO / zlib, CRC32) |
| SHA256 | `e643173a60b0916fc015e6da9d0653349b5854e51ed3ce3a32872fdb90889dc4` |
| Frontend gate | `tsc --noEmit` clean; ESLint 0 errors (19 warnings); Vitest 150/150 |
| Production config | `src-tauri/tauri.conf.json` untouched (`com.mdeditor.md-editor` / "MD MA" / `.md` associations) |
| Native GUI open/save | **UNVERIFIED** — macOS Accessibility permission denied |

## Closure branch kawlas/final-closure

**Source SHA (frozen):** `87724dc`

### Changes

- **HIGH fix:** `doNewFile` now clears both `markdown` and `previewMarkdown`
  state. Previously only the preview was cleared, leaving stale editor content
  visible after New File.
- **AGENTS.md:** corrected stale facts (component list, localStorage keys,
  shortcut descriptions, git remote).
- **Docs:** English README corrections, known limits, user guide, development,
  release notes. Corrected theme count (19 built-in + system = 20), font count
  (12), raw HTML handling claim, SAMPLE_MARKDOWN theme count.

```sh
export CARGO_TARGET_DIR="$PWD/.cache/cargo"
export TAURI_TARGET_DIR="$PWD/.cache/tauri"
export APPLE_SIGNING_IDENTITY='-'
cargo tauri build --config "$PWD/.cache/qa-config.json"
```

Then record the new DMG path + SHA256 here and update `README.md` Install
section. No main-merge or public release publication until ROOT reviews the
result.
