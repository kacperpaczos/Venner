use crate::state::{Action, AppState, ImportResult, ValidationReport, VennerStore};
use crate::theme::monitor;
use crate::theme::resolver;
use std::collections::HashMap;

/// Tauri commands dla IPC
#[tauri::command]
pub fn dispatch(store: tauri::State<VennerStore>, action: Action) {
    store.dispatch(action);
}

#[tauri::command]
pub fn get_state(store: tauri::State<VennerStore>) -> AppState {
    store.get_state()
}

#[tauri::command]
pub fn inject_state(store: tauri::State<VennerStore>, state: AppState) {
    store.inject_state(state);
}

#[tauri::command]
pub fn get_schema_version(store: tauri::State<VennerStore>) -> u32 {
    store.schema_version()
}

#[tauri::command]
pub fn export_state(store: tauri::State<VennerStore>) -> Result<String, String> {
    store.export_state_json(env!("CARGO_PKG_VERSION"))
}

#[tauri::command]
pub fn validate_state(
    store: tauri::State<VennerStore>,
    json: String,
) -> Result<ValidationReport, String> {
    Ok(store.validate_state_json(&json))
}

#[tauri::command]
pub fn import_state(
    store: tauri::State<VennerStore>,
    json: String,
) -> Result<ImportResult, String> {
    Ok(store.import_state_json(&json))
}

/// Current desktop environment label (`gnome`, `kde`, `cinnamon`, `xfce`, `unknown:...`).
#[tauri::command]
pub fn get_desktop_env() -> String {
    resolver::detect_desktop().to_string()
}

/// Return current GTK theme as Venner CSS tokens (--venner-* keys).
#[tauri::command]
pub fn get_gtk_theme() -> Result<HashMap<String, String>, String> {
    Ok(monitor::load_theme_tokens())
}

/// Return diagnostics for GTK theme loading pipeline.
#[tauri::command]
pub fn get_gtk_theme_diagnostics() -> Result<monitor::ThemeDiagnostics, String> {
    Ok(monitor::load_theme_with_diagnostics().1)
}

/// Return compiled GTK theme contract (tokens + window + widgets).
#[tauri::command]
pub fn get_compiled_gtk_theme() -> Result<crate::theme::compiled_theme::CompiledGtkTheme, String> {
    Ok(monitor::load_compiled_theme_with_diagnostics().0)
}

/// Return diagnostics for compiled GTK theme loading.
#[tauri::command]
pub fn get_compiled_gtk_theme_diagnostics() -> Result<monitor::ThemeDiagnostics, String> {
    Ok(monitor::load_compiled_theme_with_diagnostics().1)
}
