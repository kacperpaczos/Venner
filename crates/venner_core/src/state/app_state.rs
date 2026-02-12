use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

/// Single Source of Truth - cały stan aplikacji
#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[specta(export)]
pub struct AppState {
    pub version: u32,
    pub windows: HashMap<String, WindowState>,
    pub widgets: HashMap<String, WidgetState>,
    pub theme: ThemeTokens,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
pub struct WindowState {
    pub id: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
    pub focused: bool,
    pub route: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
pub struct WidgetState {
    pub id: String,
    pub kind: String,
    pub props: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
pub struct ThemeTokens {
    pub bg: String,
    pub fg: String,
    pub accent: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
pub enum Action {
    WidgetUpdate {
        widget_id: String,
        field: String,
        value: serde_json::Value,
    },
    WindowResize {
        window_id: String,
        width: u32,
        height: u32,
    },
    WindowMove {
        window_id: String,
        x: i32,
        y: i32,
    },
    Navigate {
        window_id: String,
        route: String,
    },
    ThemeChanged {
        tokens: ThemeTokens,
    },
}
