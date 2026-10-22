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

The rc1 DMG + SHA256 are preserved at `artifacts/v0.1.0-rc.1/`. This source tag
is **superseded** by `kawlas/final-closure` after review passes; the historical
artifact is kept for downgrade/revert.

### rc1 artifact

| File | Path | SHA256 |
|---|---|---|
| DMG | `artifacts/v0.1.0-rc.1/MD.MA.QA_0.1.0_aarch64.dmg` | `5453b8ea06cabb6925309069a09eeaaf5587689e7e6c19b1d5cb6c6237c633c8` |

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

## Closure branch kawlas/final-closure

**Source SHA (frozen):** `9b0693ecce37148f2b70c9ef9a8e6a71a9be447d`

### Change

- **HIGH fix:** `doNewFile` now clears both `markdown` and `previewMarkdown`
  state. Previously only the preview was cleared, leaving stale editor content
  visible after New File.
- **AGENTS.md:** corrected stale facts (component list, localStorage keys,
  shortcut descriptions, git remote).

## Next release (rc2)

After reviewer approval of the final-closure branch, produce rc2:

```sh
export CARGO_TARGET_DIR="$PWD/.cache/cargo"
export TAURI_TARGET_DIR="$PWD/.cache/tauri"
export APPLE_SIGNING_IDENTITY='-'
cargo tauri build --config "$PWD/.cache/qa-config.json"
```

Then record the new DMG path + SHA256 here and update `README.md` Install
section. No main-merge or public release publication until ROOT reviews the
result.
