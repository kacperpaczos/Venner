use super::app_state::{Action, AppState};
use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Emitter};

/// Venner Store - Redux-like state management w Rust
pub struct VennerStore {
    state: Arc<RwLock<AppState>>,
    app_handle: Arc<RwLock<Option<AppHandle>>>,
}

impl VennerStore {
    pub fn new(initial: AppState) -> Self {
        Self {
            state: Arc::new(RwLock::new(initial)),
            app_handle: Arc::new(RwLock::new(None)),
        }
    }

    pub fn set_app_handle(&self, app_handle: AppHandle) {
        *self.app_handle.write().unwrap() = Some(app_handle);
    }

    pub fn dispatch(&self, action: Action) {
        let next_state = {
            let mut state = self.state.write().unwrap();
            Self::reduce(&mut state, &action);
            state.clone()
        };

        self.emit_state_changed(&next_state);
    }

    pub fn get_state(&self) -> AppState {
        self.state.read().unwrap().clone()
    }

    pub fn inject_state(&self, state: AppState) {
        *self.state.write().unwrap() = state.clone();
        self.emit_state_changed(&state);
    }

    fn reduce(state: &mut AppState, action: &Action) {
        match action {
            Action::WidgetUpdate {
                widget_id,
                field,
                value,
            } => {
                if let Some(widget) = state.widgets.get_mut(widget_id) {
                    widget.props[field] = value.clone();
                }
            }
            Action::WindowResize {
                window_id,
                width,
                height,
            } => {
                if let Some(window) = state.windows.get_mut(window_id) {
                    window.width = *width;
                    window.height = *height;
                }
            }
            _ => {}
        }
    }

    fn emit_state_changed(&self, state: &AppState) {
        if let Some(app_handle) = self.app_handle.read().unwrap().clone() {
            let _ = app_handle.emit("state:changed", state);
        }
    }
}
