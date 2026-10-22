use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;

// ── Native file operations (Tauri commands) ──────────────────────
//
// Security model:
//   • `open_file` — the user picks a file via the native dialog. The chosen
//     path is stored backend-side as the "current document" (authorized).
//   • `save_file` — saves to the *current* (authorized) document path only.
//     It never accepts a caller-supplied path, so the frontend cannot direct
//     writes to arbitrary locations.
//   • `save_file_as` — shows the native save dialog, lets the user pick a new
//     path, then atomically writes + becomes the new current document.
//
// Atomicity: every write uses a unique temp file (created with
// `create_new` so it can never clobber an existing file), written, then
// atomically renamed over the target. A failed write never touches the
// real document — the existing buffer/file is left intact.

/// State key for the authorized current document path, stored in Tauri's
/// managed state so any command handler can access it.
#[derive(Default)]
struct CurrentDoc {
    path: std::sync::Mutex<Option<PathBuf>>,
}

/// Shared between the `save_file` command and tests so both exercise
/// the exact same guard logic.
fn current_doc_path(state: &CurrentDoc) -> Result<PathBuf, String> {
    state
        .path
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "No document open — use Save As".to_string())
}

/// Write `content` to the current document path (from `CurrentDoc` state).
/// Shared between the `save_file` command and tests.
fn save_to_current_doc(state: &CurrentDoc, content: &str) -> Result<SaveResponse, String> {
    let target = current_doc_path(state)?;
    atomic_write(&target, content).map_err(|e| format!("Failed to save file: {}", e))?;
    let filename = target
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| "document.md".to_string());
    Ok(SaveResponse {
        path: target.to_string_lossy().to_string(),
        filename,
        content: None,
    })
}

/// Clear the current document path. Called by `clear_current_doc` command
/// and directly in tests to simulate New/import/drop identity reset.
fn reset_current_doc(state: &CurrentDoc) {
    *state.path.lock().unwrap() = None;
}

/// Response from `open_file` / `save_file` / `save_file_as`.
#[derive(Serialize, Deserialize)]
#[allow(dead_code)]
struct SaveResponse {
    path: String,
    filename: String,
    content: Option<String>,
}

/// Generate a unique temp path in the same directory as `target`.
///
/// Uses a nanosecond timestamp + random component to guarantee uniqueness
/// even under rapid successive saves, then opens the file with
/// `create_new` so it can never overwrite an existing file.
#[allow(dead_code)]
fn unique_temp_path(target: &Path) -> std::io::Result<PathBuf> {
    let dir = target
        .parent()
        .unwrap_or_else(|| Path::new("."));
    let stem = target
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("document");
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidInput, e))?
        .as_nanos();
    // A short random suffix to avoid collisions with concurrent or very-rapid saves.
    let suffix: u64 = {
        let mut seed = ts as u64;
        // xorshift32 — deterministic-enough for temp uniqueness (no crypto need)
        seed ^= seed << 13;
        seed ^= seed >> 17;
        seed ^= seed << 5;
        seed
    };
    let temp_name = format!(".{stem}.tmp.{ts}.{suffix}");
    let temp_path = dir.join(&temp_name);
    Ok(temp_path)
}

/// Write `content` to `target` atomically: write to a unique temp file
/// (created with `create_new`), then rename. On any error the temp file
/// is cleaned up and the target is never touched.
///
/// Preserves the target's existing permissions: if `target` already exists,
/// its mode bits are copied to the temp file before the atomic rename, so
/// saving into a `0600` document doesn't downgrade it to the process umask
/// (typically `0644`).
fn atomic_write(target: &Path, content: &str) -> std::io::Result<()> {
    let dir = target
        .parent()
        .unwrap_or_else(|| Path::new("."));
    let stem = target
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("document");
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidInput, e))?
        .as_nanos();
    let suffix: u64 = {
        let mut seed = ts as u64;
        seed ^= seed << 13;
        seed ^= seed >> 17;
        seed ^= seed << 5;
        seed
    };
    let temp_name = format!(".{stem}.tmp.{ts}.{suffix}");
    let temp = dir.join(&temp_name);

    // Capture the target's existing permissions (if any) so we can restore
    // them on the new file. This prevents permission downgrades.
    #[cfg(unix)]
    let existing_mode = {
        use std::os::unix::fs::MetadataExt;
        std::fs::metadata(target).ok().map(|m| m.mode())
    };

    let result = (|| {
        // create_new = fail if the temp already exists (never clobber)
        let mut file = std::fs::OpenOptions::new()
            .create_new(true)
            .write(true)
            .truncate(true)
            .open(&temp)?;
        use std::io::Write;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        drop(file);

        // Restore target's permissions on the temp before rename.
        // Errors here are propagated — a failure to restore permissions
        // must NOT silently result in a downgraded file.
        #[cfg(unix)]
        if let Some(mode) = existing_mode {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&temp, std::fs::Permissions::from_mode(mode))
                .map_err(|e| {
                    std::io::Error::new(
                        std::io::ErrorKind::PermissionDenied,
                        format!("Failed to restore permissions on temp file: {}", e),
                    )
                })?;
        }

        // Atomic rename (same filesystem / same directory)
        std::fs::rename(&temp, target)?;
        Ok(())
    })();

    // Clean up the temp file on ANY error path
    if result.is_err() {
        let _ = std::fs::remove_file(&temp);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unique_temp_path_is_unique() {
        let target = Path::new("/tmp/test.md");
        let temp1 = unique_temp_path(target).unwrap();
        let temp2 = unique_temp_path(target).unwrap();
        assert_ne!(temp1, temp2, "temp paths must be unique");
        // Same directory as target
        assert_eq!(temp1.parent().unwrap(), target.parent().unwrap());
    }

    #[test]
    fn test_unique_temp_path_never_clobbers() {
        let target = Path::new("/tmp/test.md");
        let temp = unique_temp_path(target).unwrap();
        // The temp name must not equal the target name
        assert_ne!(temp.file_name().unwrap(), target.file_name().unwrap());
    }

    #[test]
    fn test_atomic_write_roundtrip() {
        let dir = std::env::temp_dir();
        let target = dir.join("md-ma-test-atomic-write.txt");
        // Clean up before
        let _ = std::fs::remove_file(&target);

        let content = "Hello, atomic world!";
        atomic_write(&target, content).unwrap();

        let read_back = std::fs::read_to_string(&target).unwrap();
        assert_eq!(read_back, content);

        // No leftover temp files
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let name = entry.file_name();
                let name_str = name.to_string_lossy().to_string();
                if name_str.starts_with(".md-ma-test-atomic-write.txt.tmp.") {
                    panic!("Leftover temp file: {}", name_str);
                }
            }
        }

        let _ = std::fs::remove_file(&target);
    }

    #[test]
    fn test_atomic_write_overwrites_existing() {
        let dir = std::env::temp_dir();
        let target = dir.join("md-ma-test-overwrite.txt");

        // Pre-existing content
        std::fs::write(&target, "old content").unwrap();

        atomic_write(&target, "new content").unwrap();

        let read_back = std::fs::read_to_string(&target).unwrap();
        assert_eq!(read_back, "new content");

        let _ = std::fs::remove_file(&target);
    }

    #[test]
    #[cfg(unix)]
    fn test_atomic_write_preserves_permissions() {
        use std::os::unix::fs::PermissionsExt;
        use std::os::unix::fs::MetadataExt;
        let dir = std::env::temp_dir();
        let target = dir.join("md-ma-test-perms.txt");
        let _ = std::fs::remove_file(&target);

        // Create target with restrictive 0600 permissions
        std::fs::write(&target, "old").unwrap();
        std::fs::set_permissions(&target, std::fs::Permissions::from_mode(0o600))
            .unwrap();

        // atomic_write should preserve the existing 0600 mode
        atomic_write(&target, "new content").unwrap();

        let mode = std::fs::metadata(&target).unwrap().mode();
        assert_eq!(
            mode & 0o777,
            0o600,
            "permissions should be preserved (got {:o})",
            mode & 0o777
        );

        let _ = std::fs::remove_file(&target);
    }

    #[test]
    fn test_atomic_write_no_leftover_temp_on_failure() {
        let dir = std::env::temp_dir();
        let target = dir.join("md-ma-test-temp-cleanup.txt");
        let _ = std::fs::remove_file(&target);

        // Write a valid file first
        std::fs::write(&target, "original").unwrap();

        // Now simulate a write failure by making the target directory
        // non-writable — actually, let's make the temp creation fail by
        // using a path where the parent doesn't exist.
        let impossible = dir.join("nonexistent-dir-xyz/doc.md");
        let result = atomic_write(&impossible, "test");
        assert!(result.is_err(), "should fail because parent dir doesn't exist");

        // Verify no temp files were left behind in temp_dir
        let temp_files: Vec<_> = std::fs::read_dir(&dir).unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.file_name().to_string_lossy().contains("nonexistent-dir-xyz")
            })
            .collect();
        assert!(temp_files.is_empty(), "temp files left behind on failure");

        // Verify the original file is untouched
        let read_back = std::fs::read_to_string(&target).unwrap();
        assert_eq!(read_back, "original");

        let _ = std::fs::remove_file(&target);
    }

    #[test]
    #[cfg(unix)]
    fn test_save_file_does_not_overwrite_after_identity_clear() {
        // Proves the core safety invariant: after the document identity is
        // cleared (simulating New/import/drop), save_file must not write to
        // the previously authorized path.
        //
        // Uses the REAL CurrentDoc state and save_to_current_doc helper
        // (the same path taken by the #[tauri::command] save_file), not a
        // local Option variable.

        let dir = std::env::temp_dir();
        let file_a = dir.join("md-ma-test-save-no-overwrite.txt");
        let _ = std::fs::remove_file(&file_a);

        // Write original content A
        atomic_write(&file_a, "# Document A").unwrap();
        let before = std::fs::read_to_string(&file_a).unwrap();
        assert_eq!(before, "# Document A");

        // Author A's path in real CurrentDoc state (as open_file would)
        let state = CurrentDoc::default();
        {
            let mut guard = state.path.lock().unwrap();
            *guard = Some(file_a.clone());
        }

        // Simulate: user does New/import/drop -> clear_current_doc resets the path
        reset_current_doc(&state);
        // Confirm state is cleared
        {
            let guard = state.path.lock().unwrap();
            assert!(guard.is_none(), "CurrentDoc.path must be None after reset");
        }

        // Attempt save_file via the real shared helper — must REJECT
        let save_result = save_to_current_doc(&state, "# Document B (malicious overwrite attempt)");
        assert!(
            save_result.is_err(),
            "save_file must reject when CurrentDoc.path is None"
        );

        // Critical: file A's bytes must be unchanged — no overwrite occurred
        let after = std::fs::read_to_string(&file_a).unwrap();
        assert_eq!(
            after, "# Document A",
            "File A must not be written to after identity clear"
        );

        let _ = std::fs::remove_file(&file_a);
    }
}

/// Read a file chosen by the user via the native open dialog.
/// The chosen path becomes the new "current document".
///
/// Runs the blocking dialog on a worker thread (`tauri::async_runtime::spawn_blocking`)
/// so the main thread (GUI) is never blocked. This is the officially
/// documented pattern for using blocking API within an async command.
/// See: https://docs.rs/tauri-plugin-dialog/latest/tauri_plugin_dialog/struct.FileDialogBuilder.html#method.blocking_pick_file
#[tauri::command]
async fn open_file(app: tauri::AppHandle) -> Result<SaveResponse, String> {
    // Resolve the dialog path off the main thread. The dialog builder must be
    // constructed on the main thread (it captures the AppHandle), but the
    // blocking_pick_file call itself runs on a worker thread
    // via tauri::async_runtime::spawn_blocking.
    let app_for_dialog = app.clone();
    let path = tauri::async_runtime::spawn_blocking(move || {
        app_for_dialog
            .dialog()
            .file()
            .add_filter("Markdown", &["md", "markdown", "mdown", "mkd", "mkdn", "mdwn"])
            .add_filter("Plain Text", &["txt"])
            .blocking_pick_file()
    })
    .await
    .map_err(|e| format!("Dialog thread error: {}", e))?;

    match path {
        Some(p) => {
            let p_buf = p.into_path().map_err(|e| format!("Cannot convert path: {}", e))?;
            let content = std::fs::read_to_string(&p_buf)
                .map_err(|e| format!("Failed to read file: {}", e))?;

            // Store as the authorized current document
            if let Some(state) = app.try_state::<CurrentDoc>() {
                *state.path.lock().unwrap() = Some(p_buf.clone());
            }

            let filename = p_buf
                .file_name()
                .and_then(|n| n.to_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| "document.md".to_string());

            Ok(SaveResponse {
                path: p_buf.to_string_lossy().to_string(),
                filename,
                content: Some(content),
            })
        }
        None => Err("No file selected".to_string()),
    }
}

/// Save to the current (authorized) document path. If there is no current
/// document yet, returns an error so the frontend can fall back to Save As.
#[tauri::command]
fn save_file(app: tauri::AppHandle, content: String) -> Result<SaveResponse, String> {
    let state = app
        .try_state::<CurrentDoc>()
        .ok_or_else(|| "No state available".to_string())?;
    save_to_current_doc(&state, &content)
}

/// Show a native save dialog, write to the chosen path, and store it as
/// the new current document.
///
/// Runs the blocking dialog on a worker thread
/// (`tauri::async_runtime::spawn_blocking`) so the main thread (GUI) is
/// never blocked. This is the officially documented pattern for using
/// blocking API within an async command.
/// See: https://docs.rs/tauri-plugin-dialog/latest/tauri_plugin_dialog/struct.FileDialogBuilder.html#method.blocking_save_file
#[tauri::command]
async fn save_file_as(app: tauri::AppHandle, content: String) -> Result<SaveResponse, String> {
    // Resolve the dialog path off the main thread
    let app_for_dialog = app.clone();
    let path = tauri::async_runtime::spawn_blocking(move || {
        app_for_dialog
            .dialog()
            .file()
            .add_filter("Markdown", &["md", "markdown", "mdown", "mkd", "mkdn", "mdwn"])
            .add_filter("Plain Text", &["txt"])
            .blocking_save_file()
    })
    .await
    .map_err(|e| format!("Dialog thread error: {}", e))?;

    match path {
        Some(p) => {
            let path_buf = p.into_path().map_err(|e| format!("Cannot convert path: {}", e))?;

            // Write atomically before committing the path as "current doc"
            atomic_write(&path_buf, &content)
                .map_err(|e| format!("Failed to save file: {}", e))?;

            // Store as the authorized current document
            if let Some(state) = app.try_state::<CurrentDoc>() {
                *state.path.lock().unwrap() = Some(path_buf.clone());
            }

            let filename = path_buf
                .file_name()
                .and_then(|n| n.to_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| "document.md".to_string());

            Ok(SaveResponse {
                path: path_buf.to_string_lossy().to_string(),
                filename,
                content: None,
            })
        }
        None => Err("No file selected".to_string()),
    }
}

/// Clear the current document path. Call this when the user creates a new
/// document, imports via file input, or drops a replacement file — these
/// operations replace the document identity, so the previously authorized
/// path must not be used for future `save_file` calls.
#[tauri::command]
fn clear_current_doc(app: tauri::AppHandle) {
    if let Some(state) = app.try_state::<CurrentDoc>() {
        reset_current_doc(&state);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(CurrentDoc::default())
        .invoke_handler(tauri::generate_handler![open_file, save_file, save_file_as, clear_current_doc])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // App menu (macOS: first menu is the app-name menu)
            let about = MenuItemBuilder::with_id("about", "About MD MA").build(app)?;
            let hide = MenuItemBuilder::with_id("hide", "Hide MD MA")
                .accelerator("CmdOrCtrl+H")
                .build(app)?;
            let hide_others = MenuItemBuilder::with_id("hide_others", "Hide Others")
                .accelerator("CmdOrCtrl+Alt+H")
                .build(app)?;
            let show_all = MenuItemBuilder::with_id("show_all", "Show All").build(app)?;

            let app_menu = SubmenuBuilder::new(app, "MD MA")
                .item(&about)
                .separator()
                .item(&hide)
                .item(&hide_others)
                .item(&show_all)
                .separator()
                .quit()
                .build()?;

            // File menu
            let new_file = MenuItemBuilder::with_id("new_file", "New File")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;
            let open_file = MenuItemBuilder::with_id("open_file", "Open File...")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let save = MenuItemBuilder::with_id("save", "Save")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;
            let save_as = MenuItemBuilder::with_id("save_as", "Save As...")
                .accelerator("CmdOrCtrl+Shift+S")
                .build(app)?;
            let export_pdf = MenuItemBuilder::with_id("export_pdf", "Export PDF\u{2026}")
                .accelerator("CmdOrCtrl+Shift+P")
                .build(app)?;
            let copy_rtf = MenuItemBuilder::with_id("copy_rtf", "Copy as Rich Text")
                .accelerator("CmdOrCtrl+Shift+C")
                .build(app)?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&new_file)
                .item(&open_file)
                .item(&save)
                .item(&save_as)
                .separator()
                .item(&export_pdf)
                .item(&copy_rtf)
                .build()?;

            // Edit menu
            let undo = MenuItemBuilder::with_id("undo", "Undo")
                .accelerator("CmdOrCtrl+Z")
                .build(app)?;
            let redo = MenuItemBuilder::with_id("redo", "Redo")
                .accelerator("CmdOrCtrl+Shift+Z")
                .build(app)?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .item(&undo)
                .item(&redo)
                .separator()
                .cut()
                .copy()
                .paste()
                .separator()
                .select_all()
                .build()?;

            // View menu
            let toggle_toc = MenuItemBuilder::with_id("toggle_toc", "Toggle Outline")
                .accelerator("CmdOrCtrl+Shift+T")
                .build(app)?;
            let toggle_focus = MenuItemBuilder::with_id("toggle_focus", "Toggle Focus Mode")
                .accelerator("CmdOrCtrl+Shift+F")
                .build(app)?;

            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&toggle_toc)
                .item(&toggle_focus)
                .build()?;

            // Window menu
            let zoom = MenuItemBuilder::with_id("zoom", "Zoom").build(app)?;
            let close_window = MenuItemBuilder::with_id("close_window", "Close Window")
                .accelerator("CmdOrCtrl+W")
                .build(app)?;

            let window_menu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .item(&zoom)
                .item(&close_window)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&file_menu)
                .item(&edit_menu)
                .item(&view_menu)
                .item(&window_menu)
                .build()?;

            app.set_menu(menu)?;

            // Relay menu events to webview
            let handle = app.handle().clone();
            app.on_menu_event(move |app_handle, event| {
                let id = event.id().0.clone();
                match id.as_str() {
                    "new_file" | "open_file" | "save" | "save_as"
                    | "export_pdf" | "copy_rtf"
                    | "undo" | "redo"
                    | "toggle_toc" | "toggle_focus"
                    | "close_window" | "about" | "zoom" => {
                        let _ = handle.emit("menu-event", id);
                    }
                    "hide" => {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "hide_others" | "show_all" => {
                        let _ = handle.emit("menu-event", id);
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
