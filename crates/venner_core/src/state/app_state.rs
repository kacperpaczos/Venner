use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

pub const CURRENT_SCHEMA_VERSION: u32 = 2;

/// Single Source of Truth - cały stan aplikacji
#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[specta(export)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    #[serde(default = "default_state_version")]
    pub version: u32,
    #[serde(default = "default_schema_version")]
    pub schema_version: u32,
    #[serde(default)]
    pub session: SessionState,
    #[serde(default)]
    pub windows: HashMap<String, WindowState>,
    #[serde(default)]
    pub widgets: HashMap<String, WidgetState>,
    #[serde(default)]
    pub ui: UiState,
    #[serde(default)]
    pub theme: ThemeTokens,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct SessionState {
    #[serde(default)]
    pub current_window_id: String,
    #[serde(default)]
    pub active_route: String,
    #[serde(default)]
    pub workflow_stage: String,
    #[serde(default = "default_ui_scale")]
    pub ui_scale: f64,
}

impl Default for SessionState {
    fn default() -> Self {
        Self {
            current_window_id: "main".to_string(),
            active_route: "/".to_string(),
            workflow_stage: "initial".to_string(),
            ui_scale: default_ui_scale(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScrollState {
    #[serde(default)]
    pub x: f64,
    #[serde(default)]
    pub y: f64,
    #[serde(default)]
    pub anchor_id: Option<String>,
}

impl Default for ScrollState {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            anchor_id: None,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct ViewportState {
    #[serde(default = "default_ui_scale")]
    pub zoom: f64,
    #[serde(default)]
    pub density: Option<String>,
    #[serde(default)]
    pub breakpoint: Option<String>,
}

impl Default for ViewportState {
    fn default() -> Self {
        Self {
            zoom: default_ui_scale(),
            density: None,
            breakpoint: None,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    pub id: String,
    #[serde(default)]
    pub x: i32,
    #[serde(default)]
    pub y: i32,
    #[serde(default = "default_window_width")]
    pub width: u32,
    #[serde(default = "default_window_height")]
    pub height: u32,
    #[serde(default)]
    pub maximized: bool,
    #[serde(default)]
    pub focused: bool,
    #[serde(default = "default_route")]
    pub route: String,
    #[serde(default = "default_tiled")]
    pub tiled: String,
    #[serde(default)]
    pub scroll: ScrollState,
    #[serde(default)]
    pub viewport: ViewportState,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct WidgetState {
    pub id: String,
    pub kind: String,
    #[serde(default)]
    pub disabled: bool,
    #[serde(default)]
    pub persistent: serde_json::Value,
    #[serde(default)]
    pub transient: serde_json::Value,
    #[serde(default)]
    pub updated_at: u32,
    #[serde(default)]
    pub source: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct FocusState {
    #[serde(default)]
    pub widget_id: Option<String>,
    #[serde(default)]
    pub caret_start: Option<u32>,
    #[serde(default)]
    pub caret_end: Option<u32>,
}

impl Default for FocusState {
    fn default() -> Self {
        Self {
            widget_id: None,
            caret_start: None,
            caret_end: None,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct UiState {
    #[serde(default)]
    pub tabs: HashMap<String, String>,
    #[serde(default)]
    pub focus: FocusState,
    #[serde(default)]
    pub panels: HashMap<String, bool>,
    #[serde(default)]
    pub last_updated_at: u32,
}

impl Default for UiState {
    fn default() -> Self {
        Self {
            tabs: HashMap::new(),
            focus: FocusState::default(),
            panels: HashMap::new(),
            last_updated_at: 0,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct ThemeTokens {
    #[serde(default = "default_bg")]
    pub bg: String,
    #[serde(default = "default_fg")]
    pub fg: String,
    #[serde(default = "default_accent")]
    pub accent: String,
}

impl Default for ThemeTokens {
    fn default() -> Self {
        Self {
            bg: default_bg(),
            fg: default_fg(),
            accent: default_accent(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct PersistedAppState {
    pub schema_version: u32,
    pub exported_at: u32,
    pub app_version: String,
    pub state: AppState,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct ValidationReport {
    pub valid: bool,
    pub schema_version: Option<u32>,
    pub target_schema_version: u32,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub applied: bool,
    pub migrated_from: Option<u32>,
    pub schema_version: u32,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Type)]
#[serde(tag = "type")]
pub enum Action {
    WidgetRegister {
        widget_id: String,
        kind: String,
        initial: Option<serde_json::Value>,
    },
    WidgetStatePatch {
        widget_id: String,
        patch: serde_json::Value,
    },
    WidgetTransient {
        widget_id: String,
        transient: serde_json::Value,
    },
    WidgetCommit {
        widget_id: String,
        value: serde_json::Value,
    },
    WidgetDisable {
        widget_id: String,
        disabled: bool,
    },
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
    SessionUpdate {
        patch: serde_json::Value,
    },
    WindowScroll {
        window_id: String,
        x: f64,
        y: f64,
        anchor_id: Option<String>,
    },
    WindowViewport {
        window_id: String,
        zoom: f64,
        density: Option<String>,
        breakpoint: Option<String>,
    },
    UiTabsUpdate {
        id: String,
        active_tab: String,
    },
    UiFocusUpdate {
        widget_id: Option<String>,
        caret_start: Option<u32>,
        caret_end: Option<u32>,
    },
    UiPanelUpdate {
        id: String,
        collapsed: bool,
    },
    Navigate {
        window_id: String,
        route: String,
    },
    WindowTile {
        window_id: String,
        tiled: String,
    },
    ThemeChanged {
        tokens: ThemeTokens,
    },
}

fn default_state_version() -> u32 {
    1
}

fn default_schema_version() -> u32 {
    CURRENT_SCHEMA_VERSION
}

fn default_window_width() -> u32 {
    800
}

fn default_window_height() -> u32 {
    600
}

fn default_route() -> String {
    "/".to_string()
}

fn default_tiled() -> String {
    "none".to_string()
}

fn default_ui_scale() -> f64 {
    1.0
}

fn default_bg() -> String {
    "#353535".to_string()
}

fn default_fg() -> String {
    "#eeeeec".to_string()
}

fn default_accent() -> String {
    "#3584e4".to_string()
}
