use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
