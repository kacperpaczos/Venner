use std::collections::HashMap;
use venner_core::app_state::{AppState, ThemeTokens};
use venner_core::commands::{dispatch, get_gtk_theme, get_state, inject_state};
use venner_core::theme_monitor;
use venner_core::VennerStore;

fn default_app_state() -> AppState {
    AppState {
        version: 1,
        windows: HashMap::new(),
        widgets: HashMap::new(),
        theme: ThemeTokens {
            bg: "#353535".to_string(),
            fg: "#eeeeec".to_string(),
            accent: "#3584e4".to_string(),
        },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(VennerStore::new(default_app_state()))
        .invoke_handler(tauri::generate_handler![dispatch, get_state, inject_state, get_gtk_theme])
        .setup(|app| {
            theme_monitor::start_theme_monitor(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
