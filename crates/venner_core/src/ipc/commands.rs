use crate::theme::monitor;
use crate::state::{Action, AppState, VennerStore};
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

/// Return current GTK theme as Venner CSS tokens (--venner-* keys).
#[tauri::command]
pub fn get_gtk_theme() -> Result<HashMap<String, String>, String> {
    Ok(monitor::load_theme_tokens())
}
