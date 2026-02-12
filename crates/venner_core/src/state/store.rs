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
            Action::WindowMove { window_id, x, y } => {
                if let Some(window) = state.windows.get_mut(window_id) {
                    window.x = *x;
                    window.y = *y;
                }
            }
            Action::Navigate { window_id, route } => {
                if let Some(window) = state.windows.get_mut(window_id) {
                    window.route = route.clone();
                }
            }
            Action::ThemeChanged { tokens } => {
                state.theme = tokens.clone();
            }
        }
    }

    fn emit_state_changed(&self, state: &AppState) {
        if let Some(app_handle) = self.app_handle.read().unwrap().clone() {
            let _ = app_handle.emit("state:changed", state);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{ThemeTokens, WindowState};
    use std::collections::HashMap;

    fn sample_state() -> AppState {
        let mut windows = HashMap::new();
        windows.insert(
            "main".to_string(),
            WindowState {
                id: "main".to_string(),
                x: 10,
                y: 20,
                width: 800,
                height: 600,
                maximized: false,
                focused: true,
                route: "/home".to_string(),
            },
        );

        AppState {
            version: 1,
            windows,
            widgets: HashMap::new(),
            theme: ThemeTokens {
                bg: "#111111".to_string(),
                fg: "#eeeeee".to_string(),
                accent: "#3584e4".to_string(),
            },
        }
    }

    #[test]
    fn reduce_handles_window_move() {
        let mut state = sample_state();
        VennerStore::reduce(
            &mut state,
            &Action::WindowMove {
                window_id: "main".to_string(),
                x: 123,
                y: 456,
            },
        );
        let window = state.windows.get("main").unwrap();
        assert_eq!(window.x, 123);
        assert_eq!(window.y, 456);
    }

    #[test]
    fn reduce_handles_navigate() {
        let mut state = sample_state();
        VennerStore::reduce(
            &mut state,
            &Action::Navigate {
                window_id: "main".to_string(),
                route: "/settings".to_string(),
            },
        );
        let window = state.windows.get("main").unwrap();
        assert_eq!(window.route, "/settings");
    }

    #[test]
    fn reduce_handles_theme_changed() {
        let mut state = sample_state();
        VennerStore::reduce(
            &mut state,
            &Action::ThemeChanged {
                tokens: ThemeTokens {
                    bg: "#222222".to_string(),
                    fg: "#f5f5f5".to_string(),
                    accent: "#00aa55".to_string(),
                },
            },
        );
        assert_eq!(state.theme.bg, "#222222");
        assert_eq!(state.theme.fg, "#f5f5f5");
        assert_eq!(state.theme.accent, "#00aa55");
    }
}
