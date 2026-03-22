use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};
use venner_core::theme_monitor;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct WindowRuntimeState {
    label: String,
    native_decorations: bool,
    resizable: bool,
    maximized: bool,
    minimized: bool,
    fullscreen: bool,
    visible: bool,
    focused: bool,
    x: Option<i32>,
    y: Option<i32>,
    width: Option<u32>,
    height: Option<u32>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct WindowBehaviorProfile {
    id: String,
    #[serde(default)]
    native_decorations: Option<bool>,
    #[serde(default)]
    decorated: Option<bool>,
    chrome_style: String,
    resizable: bool,
    allow_minimize: bool,
    allow_maximize: bool,
    allow_fullscreen: bool,
    theme_mode: String,
}

impl WindowBehaviorProfile {
    fn resolved_native_decorations(&self) -> bool {
        if let Some(native) = self.native_decorations {
            return native;
        }
        if let Some(legacy) = self.decorated {
            log::warn!(
                "window_apply_profile received deprecated field `decorated`; use `nativeDecorations`"
            );
            return legacy;
        }
        false
    }
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WindowCommandResult {
    ok: bool,
    error: Option<String>,
}

fn window_ok() -> WindowCommandResult {
    WindowCommandResult { ok: true, error: None }
}

fn window_err(err: impl std::fmt::Display) -> WindowCommandResult {
    WindowCommandResult {
        ok: false,
        error: Some(err.to_string()),
    }
}

fn read_window_runtime_state(window: &tauri::WebviewWindow) -> WindowRuntimeState {
    let position = window.outer_position().ok();
    let size = window.outer_size().ok();
    WindowRuntimeState {
        label: window.label().to_string(),
        native_decorations: window.is_decorated().unwrap_or(false),
        resizable: window.is_resizable().unwrap_or(true),
        maximized: window.is_maximized().unwrap_or(false),
        minimized: window.is_minimized().unwrap_or(false),
        fullscreen: window.is_fullscreen().unwrap_or(false),
        visible: window.is_visible().unwrap_or(true),
        focused: window.is_focused().unwrap_or(false),
        x: position.as_ref().map(|p| p.x),
        y: position.as_ref().map(|p| p.y),
        width: size.as_ref().map(|s| s.width),
        height: size.as_ref().map(|s| s.height),
    }
}

#[tauri::command]
fn window_get_runtime_state(window: tauri::WebviewWindow) -> WindowRuntimeState {
    read_window_runtime_state(&window)
}

#[tauri::command]
fn window_apply_profile(
    window: tauri::WebviewWindow,
    profile: WindowBehaviorProfile,
) -> WindowCommandResult {
    if profile.theme_mode != "system-follow" {
        return window_err("unsupported_theme_mode");
    }
    if profile.chrome_style != "system-gtk" && profile.chrome_style != "debug-transparent" {
        return window_err("unsupported_chrome_style");
    }
    if let Err(err) = window.set_decorations(profile.resolved_native_decorations()) {
        return window_err(format!("set_decorations_failed:{err}"));
    }
    if let Err(err) = window.set_resizable(profile.resizable) {
        return window_err(format!("set_resizable_failed:{err}"));
    }
    window_ok()
}

#[tauri::command]
fn window_set_native_decorations(
    window: tauri::WebviewWindow,
    value: bool,
) -> WindowCommandResult {
    match window.set_decorations(value) {
        Ok(_) => window_ok(),
        Err(err) => window_err(format!("set_native_decorations_failed:{err}")),
    }
}

#[tauri::command]
fn window_set_resizable(window: tauri::WebviewWindow, value: bool) -> WindowCommandResult {
    match window.set_resizable(value) {
        Ok(_) => window_ok(),
        Err(err) => window_err(format!("set_resizable_failed:{err}")),
    }
}

#[tauri::command]
fn window_minimize(window: tauri::WebviewWindow) -> WindowCommandResult {
    match window.minimize() {
        Ok(_) => window_ok(),
        Err(err) => window_err(format!("minimize_failed:{err}")),
    }
}

#[tauri::command]
fn window_toggle_maximize(window: tauri::WebviewWindow) -> WindowCommandResult {
    let maximized = match window.is_maximized() {
        Ok(value) => value,
        Err(err) => return window_err(format!("is_maximized_failed:{err}")),
    };

    let action = if maximized {
        window.unmaximize()
    } else {
        window.maximize()
    };

    match action {
        Ok(_) => window_ok(),
        Err(err) => window_err(format!("toggle_maximize_failed:{err}")),
    }
}

#[tauri::command]
fn window_set_fullscreen(window: tauri::WebviewWindow, value: bool) -> WindowCommandResult {
    match window.set_fullscreen(value) {
        Ok(_) => window_ok(),
        Err(err) => window_err(format!("set_fullscreen_failed:{err}")),
    }
}

#[tauri::command]
fn window_start_dragging(window: tauri::WebviewWindow) -> WindowCommandResult {
    match window.start_dragging() {
        Ok(_) => window_ok(),
        Err(err) => window_err(format!("start_dragging_failed:{err}")),
    }
}

#[tauri::command]
fn window_present(window: tauri::WebviewWindow) -> WindowCommandResult {
    match window.show() {
        Ok(_) => match window.set_focus() {
            Ok(_) => window_ok(),
            Err(err) => window_err(format!("set_focus_failed:{err}")),
        },
        Err(err) => window_err(format!("show_failed:{err}")),
    }
}

#[tauri::command]
fn window_close_request(window: tauri::WebviewWindow) -> WindowCommandResult {
    match window.close() {
        Ok(_) => window_ok(),
        Err(err) => window_err(format!("close_failed:{err}")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .target(Target::new(TargetKind::Stdout))
                .level(log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            venner_core::commands::get_desktop_env,
            venner_core::commands::get_gtk_theme,
            venner_core::commands::get_gtk_theme_diagnostics,
            venner_core::commands::get_compiled_gtk_theme,
            venner_core::commands::get_compiled_gtk_theme_diagnostics,
            window_get_runtime_state,
            window_apply_profile,
            window_set_native_decorations,
            window_set_resizable,
            window_minimize,
            window_toggle_maximize,
            window_set_fullscreen,
            window_start_dragging,
            window_present,
            window_close_request,
        ])
        .setup(|app| {
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
            if let Some(main) = app.get_webview_window("main") {
                let _ = main.set_decorations(false);
                let _ = main.set_resizable(true);
            } else {
                log::warn!("main_window_not_found");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
