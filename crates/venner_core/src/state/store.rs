use super::app_state::{
    Action, AppState, ImportResult, PersistedAppState, ValidationReport, WidgetState,
    CURRENT_SCHEMA_VERSION,
};
use serde_json::{json, Map, Value};
use std::sync::{Arc, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};
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

        self.emit("action:dispatched", &action);
        self.emit_state_changed(&next_state);
    }

    pub fn get_state(&self) -> AppState {
        self.state.read().unwrap().clone()
    }

    pub fn schema_version(&self) -> u32 {
        CURRENT_SCHEMA_VERSION
    }

    pub fn inject_state(&self, state: AppState) {
        let json = serde_json::to_string(&PersistedAppState {
            schema_version: state.schema_version,
            exported_at: now_unix(),
            app_version: "inject_state".to_string(),
            state,
        })
        .unwrap_or_else(|_| "{}".to_string());

        let result = self.import_state_json(&json);
        if !result.applied {
            log::warn!(
                "[ssot] inject_state failed errors={} warnings={}",
                result.errors.join(" | "),
                result.warnings.join(" | ")
            );
        }
    }

    pub fn export_state_json(&self, app_version: &str) -> Result<String, String> {
        let state = self.get_state();
        let snapshot = PersistedAppState {
            schema_version: CURRENT_SCHEMA_VERSION,
            exported_at: now_unix(),
            app_version: app_version.to_string(),
            state,
        };
        let out = serde_json::to_string_pretty(&snapshot).map_err(|e| e.to_string())?;
        log::info!(
            "[ssot] export version={} size={}",
            snapshot.schema_version,
            out.len()
        );
        Ok(out)
    }

    pub fn validate_state_json(&self, json_input: &str) -> ValidationReport {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();

        let parsed: Value = match serde_json::from_str(json_input) {
            Ok(v) => v,
            Err(e) => {
                return ValidationReport {
                    valid: false,
                    schema_version: None,
                    target_schema_version: CURRENT_SCHEMA_VERSION,
                    errors: vec![format!("invalid_json:{e}")],
                    warnings,
                };
            }
        };

        let (mut state_value, source_schema) =
            extract_state_value(parsed, &mut warnings, &mut errors);

        if errors.is_empty() {
            if let Err(err) = migrate_state_value(&mut state_value, source_schema, &mut warnings) {
                errors.push(err);
            }
        }

        if errors.is_empty() {
            if let Err(err) = serde_json::from_value::<AppState>(state_value) {
                errors.push(format!("deserialize_failed:{err}"));
            }
        }

        ValidationReport {
            valid: errors.is_empty(),
            schema_version: source_schema,
            target_schema_version: CURRENT_SCHEMA_VERSION,
            errors,
            warnings,
        }
    }

    pub fn import_state_json(&self, json_input: &str) -> ImportResult {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();

        let parsed: Value = match serde_json::from_str(json_input) {
            Ok(v) => v,
            Err(e) => {
                return ImportResult {
                    applied: false,
                    migrated_from: None,
                    schema_version: CURRENT_SCHEMA_VERSION,
                    warnings,
                    errors: vec![format!("invalid_json:{e}")],
                };
            }
        };

        let (mut state_value, source_schema) =
            extract_state_value(parsed, &mut warnings, &mut errors);

        let migrated_from = source_schema.filter(|v| *v < CURRENT_SCHEMA_VERSION);

        if errors.is_empty() {
            if let Err(err) = migrate_state_value(&mut state_value, source_schema, &mut warnings) {
                errors.push(err);
            }
        }

        let next_state = if errors.is_empty() {
            match serde_json::from_value::<AppState>(state_value) {
                Ok(state) => Some(state),
                Err(err) => {
                    errors.push(format!("deserialize_failed:{err}"));
                    None
                }
            }
        } else {
            None
        };

        if let Some(state) = next_state {
            log::info!(
                "[ssot] import start version={} target={}",
                source_schema.unwrap_or(1),
                CURRENT_SCHEMA_VERSION
            );
            self.emit(
                "rehydrate:started",
                &json!({ "schemaVersion": CURRENT_SCHEMA_VERSION }),
            );

            {
                let mut current = self.state.write().unwrap();
                *current = state.clone();
            }

            self.emit_state_changed(&state);
            self.emit("rehydrate:completed", &state);

            if let Some(from) = migrated_from {
                log::info!(
                    "[ssot] import migrated from={} to={}",
                    from,
                    CURRENT_SCHEMA_VERSION
                );
            }

            return ImportResult {
                applied: true,
                migrated_from,
                schema_version: CURRENT_SCHEMA_VERSION,
                warnings,
                errors,
            };
        }

        log::warn!("[ssot] import failed reason={}", errors.join(" | "));
        ImportResult {
            applied: false,
            migrated_from,
            schema_version: CURRENT_SCHEMA_VERSION,
            warnings,
            errors,
        }
    }

    fn reduce(state: &mut AppState, action: &Action) {
        match action {
            Action::WidgetRegister {
                widget_id,
                kind,
                initial,
            } => {
                state
                    .widgets
                    .entry(widget_id.clone())
                    .or_insert_with(|| WidgetState {
                        id: widget_id.clone(),
                        kind: kind.clone(),
                        disabled: false,
                        persistent: initial.clone().unwrap_or(Value::Object(Map::new())),
                        transient: Value::Object(Map::new()),
                        updated_at: now_unix(),
                        source: "fsm".to_string(),
                    });
            }
            Action::WidgetStatePatch { widget_id, patch } => {
                let widget = ensure_widget(state, widget_id);
                merge_json_object(&mut widget.persistent, patch);
                widget.updated_at = now_unix();
                widget.source = "fsm".to_string();
            }
            Action::WidgetTransient {
                widget_id,
                transient,
            } => {
                let widget = ensure_widget(state, widget_id);
                merge_json_object(&mut widget.transient, transient);
                widget.updated_at = now_unix();
                widget.source = "fsm".to_string();
            }
            Action::WidgetCommit { widget_id, value } => {
                let widget = ensure_widget(state, widget_id);
                widget.persistent = value.clone();
                widget.updated_at = now_unix();
                widget.source = "fsm".to_string();
            }
            Action::WidgetDisable {
                widget_id,
                disabled,
            } => {
                let widget = ensure_widget(state, widget_id);
                widget.disabled = *disabled;
                widget.updated_at = now_unix();
                widget.source = "fsm".to_string();
            }
            Action::WidgetUpdate {
                widget_id,
                field,
                value,
            } => {
                let widget = ensure_widget(state, widget_id);
                if widget.persistent.is_object() {
                    widget.persistent[field] = value.clone();
                } else {
                    widget.persistent = json!({ field: value.clone() });
                }
                widget.updated_at = now_unix();
                widget.source = "legacy".to_string();
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
            Action::SessionUpdate { patch } => {
                if let Some(map) = patch.as_object() {
                    if let Some(v) = map.get("currentWindowId").and_then(Value::as_str) {
                        state.session.current_window_id = v.to_string();
                    }
                    if let Some(v) = map.get("activeRoute").and_then(Value::as_str) {
                        state.session.active_route = v.to_string();
                    }
                    if let Some(v) = map.get("workflowStage").and_then(Value::as_str) {
                        state.session.workflow_stage = v.to_string();
                    }
                    if let Some(v) = map.get("uiScale").and_then(Value::as_f64) {
                        state.session.ui_scale = v;
                    }
                }
            }
            Action::WindowScroll {
                window_id,
                x,
                y,
                anchor_id,
            } => {
                if let Some(window) = state.windows.get_mut(window_id) {
                    window.scroll.x = *x;
                    window.scroll.y = *y;
                    window.scroll.anchor_id = anchor_id.clone();
                }
            }
            Action::WindowViewport {
                window_id,
                zoom,
                density,
                breakpoint,
            } => {
                if let Some(window) = state.windows.get_mut(window_id) {
                    window.viewport.zoom = *zoom;
                    window.viewport.density = density.clone();
                    window.viewport.breakpoint = breakpoint.clone();
                }
            }
            Action::UiTabsUpdate { id, active_tab } => {
                state.ui.tabs.insert(id.clone(), active_tab.clone());
            }
            Action::UiFocusUpdate {
                widget_id,
                caret_start,
                caret_end,
            } => {
                state.ui.focus.widget_id = widget_id.clone();
                state.ui.focus.caret_start = *caret_start;
                state.ui.focus.caret_end = *caret_end;
            }
            Action::UiPanelUpdate { id, collapsed } => {
                state.ui.panels.insert(id.clone(), *collapsed);
            }
            Action::Navigate { window_id, route } => {
                if let Some(window) = state.windows.get_mut(window_id) {
                    window.route = route.clone();
                    state.session.active_route = route.clone();
                }
            }
            Action::ThemeChanged { tokens } => {
                state.theme = tokens.clone();
            }
        }

        state.schema_version = CURRENT_SCHEMA_VERSION;
        state.ui.last_updated_at = now_unix();
    }

    fn emit_state_changed(&self, state: &AppState) {
        self.emit("state:changed", state);
    }

    fn emit<T: serde::Serialize>(&self, event: &str, payload: &T) {
        if let Some(app_handle) = self.app_handle.read().unwrap().clone() {
            let _ = app_handle.emit(event, payload);
        }
    }
}

fn ensure_widget<'a>(state: &'a mut AppState, widget_id: &str) -> &'a mut WidgetState {
    state
        .widgets
        .entry(widget_id.to_string())
        .or_insert_with(|| WidgetState {
            id: widget_id.to_string(),
            kind: "unknown".to_string(),
            disabled: false,
            persistent: Value::Object(Map::new()),
            transient: Value::Object(Map::new()),
            updated_at: now_unix(),
            source: "auto".to_string(),
        })
}

fn merge_json_object(dst: &mut Value, patch: &Value) {
    if !dst.is_object() {
        *dst = Value::Object(Map::new());
    }
    if let (Some(dst_map), Some(patch_map)) = (dst.as_object_mut(), patch.as_object()) {
        for (k, v) in patch_map {
            dst_map.insert(k.clone(), v.clone());
        }
    }
}

fn extract_state_value(
    input: Value,
    warnings: &mut Vec<String>,
    errors: &mut Vec<String>,
) -> (Value, Option<u32>) {
    let source_schema;
    let state_value;

    match input {
        Value::Object(mut root) => {
            if let Some(state) = root.remove("state") {
                source_schema = root
                    .get("schemaVersion")
                    .or_else(|| root.get("schema_version"))
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);
                state_value = state;
            } else {
                source_schema = root
                    .get("schemaVersion")
                    .or_else(|| root.get("schema_version"))
                    .and_then(Value::as_u64)
                    .map(|v| v as u32);
                state_value = Value::Object(root);
            }
        }
        _ => {
            errors.push("state_payload_must_be_object".to_string());
            source_schema = None;
            state_value = Value::Null;
        }
    }

    if source_schema.is_none() {
        warnings.push("missing_schema_version_assuming_v1".to_string());
    }

    (state_value, source_schema)
}

fn migrate_state_value(
    state_value: &mut Value,
    schema_version: Option<u32>,
    warnings: &mut Vec<String>,
) -> Result<(), String> {
    let mut current = schema_version.unwrap_or(1);

    if current > CURRENT_SCHEMA_VERSION {
        return Err(format!(
            "unsupported_schema_version:{} > {}",
            current, CURRENT_SCHEMA_VERSION
        ));
    }

    while current < CURRENT_SCHEMA_VERSION {
        match current {
            1 => {
                migrate_v1_to_v2(state_value, warnings)?;
                current = 2;
            }
            _ => {
                return Err(format!("missing_migrator_from_v{}", current));
            }
        }
    }

    if let Value::Object(obj) = state_value {
        obj.insert(
            "schemaVersion".to_string(),
            Value::Number(CURRENT_SCHEMA_VERSION.into()),
        );
    }

    Ok(())
}

fn migrate_v1_to_v2(state_value: &mut Value, warnings: &mut Vec<String>) -> Result<(), String> {
    let obj = state_value
        .as_object_mut()
        .ok_or_else(|| "state_not_object_for_migration".to_string())?;

    obj.entry("schemaVersion".to_string())
        .or_insert(Value::Number(2.into()));

    let active_route = obj
        .get("windows")
        .and_then(Value::as_object)
        .and_then(|windows| windows.values().next())
        .and_then(|w| w.get("route"))
        .and_then(Value::as_str)
        .unwrap_or("/")
        .to_string();

    obj.entry("session".to_string()).or_insert(json!({
        "currentWindowId": "main",
        "activeRoute": active_route,
        "workflowStage": "initial",
        "uiScale": 1.0
    }));

    obj.entry("ui".to_string()).or_insert(json!({
        "tabs": {},
        "focus": {"widgetId": null, "caretStart": null, "caretEnd": null},
        "panels": {},
        "lastUpdatedAt": now_unix(),
    }));

    if let Some(windows) = obj.get_mut("windows").and_then(Value::as_object_mut) {
        for (_, window) in windows.iter_mut() {
            if let Some(w) = window.as_object_mut() {
                w.entry("scroll".to_string())
                    .or_insert(json!({"x": 0.0, "y": 0.0, "anchorId": null}));
                w.entry("viewport".to_string())
                    .or_insert(json!({"zoom": 1.0, "density": null, "breakpoint": null}));
            }
        }
    }

    if let Some(widgets) = obj.get_mut("widgets").and_then(Value::as_object_mut) {
        for (_, widget) in widgets.iter_mut() {
            if let Some(w) = widget.as_object_mut() {
                if let Some(props) = w.remove("props") {
                    w.insert("persistent".to_string(), props);
                    warnings.push("migrated_widget_props_to_persistent".to_string());
                }
                w.entry("disabled".to_string())
                    .or_insert(Value::Bool(false));
                w.entry("persistent".to_string())
                    .or_insert(Value::Object(Map::new()));
                w.entry("transient".to_string())
                    .or_insert(Value::Object(Map::new()));
                w.entry("updatedAt".to_string())
                    .or_insert(Value::Number(now_unix().into()));
                w.entry("source".to_string())
                    .or_insert(Value::String("migrate_v1".to_string()));
            }
        }
    }

    Ok(())
}

fn now_unix() -> u32 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as u32)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{SessionState, ThemeTokens, UiState, WindowState};
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
                scroll: Default::default(),
                viewport: Default::default(),
            },
        );

        AppState {
            version: 1,
            schema_version: CURRENT_SCHEMA_VERSION,
            session: SessionState::default(),
            windows,
            widgets: HashMap::new(),
            ui: UiState::default(),
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

    #[test]
    fn validate_rejects_invalid_json() {
        let store = VennerStore::new(sample_state());
        let report = store.validate_state_json("{broken");
        assert!(!report.valid);
        assert!(!report.errors.is_empty());
    }

    #[test]
    fn import_migrates_v1_payload() {
        let store = VennerStore::new(sample_state());
        let v1 = r##"{"version":1,"windows":{},"widgets":{},"theme":{"bg":"#1","fg":"#2","accent":"#3"}}"##;
        let result = store.import_state_json(v1);
        assert!(result.applied);
        assert_eq!(result.migrated_from, Some(1));
    }

    #[test]
    fn export_import_roundtrip() {
        let store = VennerStore::new(sample_state());
        let snapshot = store.export_state_json("test").unwrap();
        let result = store.import_state_json(&snapshot);
        assert!(result.applied);
    }

    #[test]
    fn reduce_handles_widget_state_patch_and_transient() {
        let mut state = sample_state();
        VennerStore::reduce(
            &mut state,
            &Action::WidgetRegister {
                widget_id: "list-main".to_string(),
                kind: "list-view".to_string(),
                initial: Some(json!({"selectedId":"row-2","selectedIds":["row-2"]})),
            },
        );
        VennerStore::reduce(
            &mut state,
            &Action::WidgetStatePatch {
                widget_id: "list-main".to_string(),
                patch: json!({"activeIndex": 3}),
            },
        );
        VennerStore::reduce(
            &mut state,
            &Action::WidgetTransient {
                widget_id: "list-main".to_string(),
                transient: json!({"hovered": true}),
            },
        );

        let widget = state.widgets.get("list-main").expect("widget list-main");
        assert_eq!(widget.persistent["selectedId"], "row-2");
        assert_eq!(widget.persistent["activeIndex"], 3);
        assert_eq!(widget.transient["hovered"], true);
    }

    #[test]
    fn export_import_roundtrip_keeps_new_widget_fields() {
        let store = VennerStore::new(sample_state());
        store.dispatch(Action::WidgetRegister {
            widget_id: "paned-main".to_string(),
            kind: "paned".to_string(),
            initial: Some(json!({"split": 42, "min": 15, "max": 85})),
        });
        store.dispatch(Action::WidgetCommit {
            widget_id: "paned-main".to_string(),
            value: json!({"split": 38, "min": 15, "max": 85}),
        });
        store.dispatch(Action::WidgetTransient {
            widget_id: "paned-main".to_string(),
            transient: json!({"resizing": true}),
        });

        let snapshot = store.export_state_json("test").expect("snapshot");
        let result = store.import_state_json(&snapshot);
        assert!(result.applied);
        let imported = store.get_state();
        let widget = imported.widgets.get("paned-main").expect("paned-main widget");
        assert_eq!(widget.persistent["split"], 38);
        assert_eq!(widget.transient["resizing"], true);
    }

    #[test]
    fn dispatch_reduces_and_persists_widget_selection_model() {
        let store = VennerStore::new(sample_state());
        store.dispatch(Action::WidgetRegister {
            widget_id: "list-main".to_string(),
            kind: "list-view".to_string(),
            initial: Some(json!({"selectedId": "row-1", "selectedIds": ["row-1"], "activeIndex": 0})),
        });
        store.dispatch(Action::WidgetCommit {
            widget_id: "list-main".to_string(),
            value: json!({"selectedId":"row-3","selectedIds":["row-3"],"activeIndex":2}),
        });
        let state = store.get_state();
        let widget = state.widgets.get("list-main").expect("list-main widget");
        assert_eq!(widget.persistent["selectedId"], "row-3");
        assert_eq!(widget.persistent["activeIndex"], 2);
    }
}
