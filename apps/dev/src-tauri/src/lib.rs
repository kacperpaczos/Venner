use std::collections::HashMap;
use std::process::Command;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};
use venner_core::app_state::{
    AppState, ScrollState, SessionState, ThemeTokens, UiState, ViewportState, WindowState,
};
use venner_core::theme_monitor;
use venner_core::VennerStore;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeDialogResult {
    applied: bool,
    cancelled: bool,
    value: Option<String>,
    error: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AboutDialogResult {
    applied: bool,
    error: Option<String>,
}

fn default_app_state() -> AppState {
    AppState {
        version: 1,
        schema_version: venner_core::state::CURRENT_SCHEMA_VERSION,
        session: SessionState::default(),
        windows: HashMap::from([(
            "main".to_string(),
            WindowState {
                id: "main".to_string(),
                x: 0,
                y: 0,
                width: 960,
                height: 700,
                maximized: false,
                focused: true,
                route: "/".to_string(),
                scroll: ScrollState::default(),
                viewport: ViewportState::default(),
            },
        )]),
        widgets: HashMap::new(),
        ui: UiState::default(),
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

#[cfg(target_os = "linux")]
fn run_zenity(args: &[&str]) -> NativeDialogResult {
    let output = Command::new("zenity").args(args).output();
    match output {
        Ok(result) => {
            if result.status.success() {
                let value = String::from_utf8_lossy(&result.stdout).trim().to_string();
                NativeDialogResult {
                    applied: true,
                    cancelled: false,
                    value: if value.is_empty() { None } else { Some(value) },
                    error: None,
                }
            } else {
                let stderr = String::from_utf8_lossy(&result.stderr).trim().to_string();
                NativeDialogResult {
                    applied: true,
                    cancelled: true,
                    value: None,
                    error: if stderr.is_empty() { None } else { Some(stderr) },
                }
            }
        }
        Err(err) => NativeDialogResult {
            applied: false,
            cancelled: false,
            value: None,
            error: Some(format!("zenity_not_available:{err}")),
        },
    }
}

#[cfg(not(target_os = "linux"))]
fn run_zenity(_args: &[&str]) -> NativeDialogResult {
    NativeDialogResult {
        applied: false,
        cancelled: false,
        value: None,
        error: Some("unsupported_platform".to_string()),
    }
}

#[tauri::command]
fn open_file_dialog() -> NativeDialogResult {
    run_zenity(&["--file-selection", "--title=Open File"])
}

#[tauri::command]
fn open_color_dialog() -> NativeDialogResult {
    run_zenity(&["--color-selection", "--show-palette", "--title=Select Color"])
}

#[tauri::command]
fn open_font_dialog() -> NativeDialogResult {
    run_zenity(&["--font-selection", "--title=Select Font"])
}

#[tauri::command]
fn show_about_dialog() -> AboutDialogResult {
    let result = run_zenity(&[
        "--info",
        "--title=About Venner",
        "--text=Venner GTK4 Reference Dev App",
    ]);
    AboutDialogResult {
        applied: result.applied,
        error: result.error,
    }
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
            venner_core::commands::get_schema_version,
            venner_core::commands::export_state,
            venner_core::commands::import_state,
            venner_core::commands::validate_state,
            venner_core::commands::get_gtk_theme,
            venner_core::commands::get_gtk_theme_diagnostics,
            open_file_dialog,
            open_color_dialog,
            open_font_dialog,
            show_about_dialog,
            log_to_terminal,
        ])
        .setup(|app| {
            app.state::<VennerStore>()
                .set_app_handle(app.handle().clone());
            theme_monitor::start_theme_monitor(app.handle().clone());
            let (_, diagnostics) = theme_monitor::load_theme_with_diagnostics();
            log::info!(
                "[theme] startup source={} theme={} scheme={} path={} gtk={} tokens={} reason={}",
                diagnostics.source,
                diagnostics.gtk_theme,
                diagnostics.color_scheme,
                diagnostics.resolved_css_path.as_deref().unwrap_or("<none>"),
                diagnostics.resolved_gtk_version,
                diagnostics.tokens_count,
                diagnostics.fallback_reason.as_deref().unwrap_or("none"),
            );
            log::info!("Venner dev app started — logging to stdout enabled");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
