use std::collections::HashMap;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};
use venner_core::app_state::{AppState, ThemeTokens};
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

// ── Lekka komenda: przekierowanie dowolnego stringa z frontendu do stdout ──
#[tauri::command]
fn log_to_terminal(level: String, message: String) {
    let tag = match level.as_str() {
        "error" => "\x1b[31m[ERROR]\x1b[0m",
        "warn" => "\x1b[33m[WARN]\x1b[0m",
        "info" => "\x1b[34m[INFO]\x1b[0m",
        "debug" => "\x1b[36m[DEBUG]\x1b[0m",
        "trace" => "\x1b[90m[TRACE]\x1b[0m",
        _ => "[LOG]",
    };
    println!("{tag} [frontend] {message}");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // ── Plugin log: tylko stdout, każdy log w osobnej linii ──
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .target(Target::new(TargetKind::Stdout))
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(VennerStore::new(default_app_state()))
        .invoke_handler(tauri::generate_handler![
            venner_core::commands::dispatch,
            venner_core::commands::get_state,
            venner_core::commands::inject_state,
            venner_core::commands::get_gtk_theme,
            log_to_terminal,
        ])
        .setup(|app| {
            app.state::<VennerStore>().set_app_handle(app.handle().clone());
            theme_monitor::start_theme_monitor(app.handle().clone());
            log::info!("Venner dev app started — logging to stdout enabled");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
