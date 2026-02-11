use super::app_state::{Action, AppState};
use std::sync::{Arc, RwLock};

/// Venner Store - Redux-like state management w Rust
pub struct VennerStore {
    state: Arc<RwLock<AppState>>,
}

impl VennerStore {
    pub fn new(initial: AppState) -> Self {
        Self {
            state: Arc::new(RwLock::new(initial)),
        }
    }

    pub fn dispatch(&self, action: Action) {
        let mut state = self.state.write().unwrap();
        Self::reduce(&mut state, &action);
        // TODO: Broadcast delta do JS
    }

    pub fn get_state(&self) -> AppState {
        self.state.read().unwrap().clone()
    }

    pub fn inject_state(&self, state: AppState) {
        *self.state.write().unwrap() = state;
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
}
