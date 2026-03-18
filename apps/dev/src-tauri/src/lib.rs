use std::collections::{HashMap, VecDeque};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};

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

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ViewerLogEvent {
    viewer_id: String,
    stream: String,
    line: String,
    ts: u64,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ViewerRuntimeStatus {
    viewer_id: String,
    pid: Option<u32>,
    running: bool,
    started_at: u64,
    command: String,
    args: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct GtkReferenceSummary {
    baseline: GtkReferenceBaseline,
    coverage: GtkReferenceCoverage,
    policy: GtkReferencePolicy,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct GtkReferenceBaseline {
    gtk_version: String,
    gtk_source_tag: String,
    gtk_source_commit_sha: String,
    baseline_date: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct GtkReferenceCoverage {
    total_rows: u64,
    l3: u64,
    l2: u64,
    l1: u64,
    na: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct GtkReferencePolicy {
    done_gate: Vec<String>,
    delta_vs_gtk: String,
}

#[derive(Debug)]
struct ManagedViewerProcess {
    child: Child,
    stdin: ChildStdin,
    started_at: u64,
    command: String,
    args: Vec<String>,
}

#[derive(Default)]
struct ViewerManager {
    processes: Mutex<HashMap<String, ManagedViewerProcess>>,
    logs: Arc<Mutex<VecDeque<ViewerLogEvent>>>,
}

impl ViewerManager {
    fn push_log(&self, event: ViewerLogEvent) {
        if let Ok(mut logs) = self.logs.lock() {
            logs.push_back(event);
            while logs.len() > 3000 {
                logs.pop_front();
            }
        }
    }

    fn spawn_viewer(
        &self,
        viewer_id: &str,
        command: &str,
        args: &[String],
        cwd: Option<&str>,
    ) -> Result<ViewerRuntimeStatus, String> {
        let mut processes = self
            .processes
            .lock()
            .map_err(|_| "viewer_processes_lock_failed".to_string())?;

        if let Some(existing) = processes.get_mut(viewer_id) {
            match existing.child.try_wait() {
                Ok(Some(_)) => {
                    processes.remove(viewer_id);
                }
                Ok(None) => {
                    return Ok(ViewerRuntimeStatus {
                        viewer_id: viewer_id.to_string(),
                        pid: Some(existing.child.id()),
                        running: true,
                        started_at: existing.started_at,
                        command: existing.command.clone(),
                        args: existing.args.clone(),
                    });
                }
                Err(err) => return Err(format!("viewer_try_wait_failed:{err}")),
            }
        }

        let mut cmd = Command::new(command);
        cmd.args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(dir) = cwd {
            cmd.current_dir(dir);
        }

        let mut child = cmd.spawn().map_err(|err| format!("viewer_spawn_failed:{err}"))?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "viewer_stdout_unavailable".to_string())?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| "viewer_stderr_unavailable".to_string())?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "viewer_stdin_unavailable".to_string())?;

        let now = now_unix();
        let pid = child.id();
        let id_out = viewer_id.to_string();
        let id_err = viewer_id.to_string();
        let logs_out = Arc::clone(&self.logs);
        let logs_err = Arc::clone(&self.logs);

        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().map_while(Result::ok) {
                if let Ok(mut logs) = logs_out.lock() {
                    logs.push_back(ViewerLogEvent {
                        viewer_id: id_out.clone(),
                        stream: "stdout".to_string(),
                        line,
                        ts: now_unix(),
                    });
                    while logs.len() > 3000 {
                        logs.pop_front();
                    }
                }
            }
        });

        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines().map_while(Result::ok) {
                if let Ok(mut logs) = logs_err.lock() {
                    logs.push_back(ViewerLogEvent {
                        viewer_id: id_err.clone(),
                        stream: "stderr".to_string(),
                        line,
                        ts: now_unix(),
                    });
                    while logs.len() > 3000 {
                        logs.pop_front();
                    }
                }
            }
        });

        let status = ViewerRuntimeStatus {
            viewer_id: viewer_id.to_string(),
            pid: Some(pid),
            running: true,
            started_at: now,
            command: command.to_string(),
            args: args.to_vec(),
        };

        self.push_log(ViewerLogEvent {
            viewer_id: viewer_id.to_string(),
            stream: "system".to_string(),
            line: format!("spawned pid={pid} command={command}"),
            ts: now,
        });

        processes.insert(
            viewer_id.to_string(),
            ManagedViewerProcess {
                child,
                stdin,
                started_at: now,
                command: command.to_string(),
                args: args.to_vec(),
            },
        );

        Ok(status)
    }

    fn stop_viewer(&self, viewer_id: &str) -> Result<(), String> {
        let mut processes = self
            .processes
            .lock()
            .map_err(|_| "viewer_processes_lock_failed".to_string())?;

        let Some(mut process) = processes.remove(viewer_id) else {
            return Ok(());
        };

        let _ = process.stdin.write_all(b"{\"method\":\"shutdown\"}\n");
        let _ = process.stdin.flush();

        match process.child.kill() {
            Ok(_) => {
                let _ = process.child.wait();
                self.push_log(ViewerLogEvent {
                    viewer_id: viewer_id.to_string(),
                    stream: "system".to_string(),
                    line: "stopped".to_string(),
                    ts: now_unix(),
                });
                Ok(())
            }
            Err(err) => Err(format!("viewer_stop_failed:{err}")),
        }
    }

    fn send_line(&self, viewer_id: &str, line: &str) -> Result<(), String> {
        let mut processes = self
            .processes
            .lock()
            .map_err(|_| "viewer_processes_lock_failed".to_string())?;
        let Some(process) = processes.get_mut(viewer_id) else {
            return Err("viewer_not_running".to_string());
        };

        process
            .stdin
            .write_all(format!("{line}\n").as_bytes())
            .map_err(|err| format!("viewer_send_failed:{err}"))?;
        process
            .stdin
            .flush()
            .map_err(|err| format!("viewer_send_failed:{err}"))?;

        Ok(())
    }

    fn list_statuses(&self) -> Result<Vec<ViewerRuntimeStatus>, String> {
        let mut processes = self
            .processes
            .lock()
            .map_err(|_| "viewer_processes_lock_failed".to_string())?;

        let mut stale_ids = Vec::new();
        let mut statuses = Vec::new();

        for (viewer_id, process) in processes.iter_mut() {
            let running = match process.child.try_wait() {
                Ok(Some(_)) => false,
                Ok(None) => true,
                Err(_) => false,
            };

            if !running {
                stale_ids.push(viewer_id.clone());
            }

            statuses.push(ViewerRuntimeStatus {
                viewer_id: viewer_id.clone(),
                pid: Some(process.child.id()),
                running,
                started_at: process.started_at,
                command: process.command.clone(),
                args: process.args.clone(),
            });
        }

        for id in stale_ids {
            processes.remove(&id);
        }

        Ok(statuses)
    }

    fn poll_logs(&self, limit: usize) -> Result<Vec<ViewerLogEvent>, String> {
        let mut logs = self
            .logs
            .lock()
            .map_err(|_| "viewer_logs_lock_failed".to_string())?;

        let take = std::cmp::min(limit, logs.len());
        let mut out = Vec::with_capacity(take);
        for _ in 0..take {
            if let Some(entry) = logs.pop_front() {
                out.push(entry);
            }
        }

        Ok(out)
    }
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn repo_root() -> Result<PathBuf, String> {
    let base = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let root = base
        .join("../../..")
        .canonicalize()
        .map_err(|err| format!("repo_root_unavailable:{err}"))?;
    Ok(root)
}

fn manifest_path(kind: &str, tech: &str) -> Result<PathBuf, String> {
    let file = format!("{tech}.json");
    let dir = match kind {
        "themes" => "themes",
        "widgets" => "widgets",
        _ => return Err("invalid_manifest_kind".to_string()),
    };

    Ok(repo_root()?.join("tools").join("viewers").join("manifests").join(dir).join(file))
}

fn gtk_reference_summary_path() -> Result<PathBuf, String> {
    Ok(repo_root()?
        .join("tools")
        .join("gtk-reference")
        .join("source-mapping.summary.json"))
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
                tiled: "none".to_string(),
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

#[tauri::command]
fn viewer_spawn(
    manager: tauri::State<'_, ViewerManager>,
    viewer_id: String,
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<ViewerRuntimeStatus, String> {
    let fallback_root = repo_root()?;
    let run_cwd = if let Some(raw) = cwd {
        let path = PathBuf::from(raw);
        if path.is_absolute() {
            path
        } else {
            fallback_root.join(path)
        }
    } else {
        fallback_root
    };
    let run_cwd_str = run_cwd.to_string_lossy().to_string();
    manager.spawn_viewer(&viewer_id, &command, &args, Some(&run_cwd_str))
}

#[tauri::command]
fn viewer_stop(manager: tauri::State<'_, ViewerManager>, viewer_id: String) -> Result<(), String> {
    manager.stop_viewer(&viewer_id)
}

#[tauri::command]
fn viewer_send(manager: tauri::State<'_, ViewerManager>, viewer_id: String, line: String) -> Result<(), String> {
    manager.send_line(&viewer_id, &line)
}

#[tauri::command]
fn viewer_list(manager: tauri::State<'_, ViewerManager>) -> Result<Vec<ViewerRuntimeStatus>, String> {
    manager.list_statuses()
}

#[tauri::command]
fn viewer_poll_logs(manager: tauri::State<'_, ViewerManager>, limit: Option<usize>) -> Result<Vec<ViewerLogEvent>, String> {
    manager.poll_logs(limit.unwrap_or(200))
}

#[tauri::command]
fn viewer_load_manifest(kind: String, tech: String) -> Result<serde_json::Value, String> {
    let path = manifest_path(&kind, &tech)?;
    let data = std::fs::read_to_string(&path).map_err(|err| format!("manifest_read_failed:{}:{err}", path.display()))?;
    serde_json::from_str(&data).map_err(|err| format!("manifest_parse_failed:{}:{err}", path.display()))
}

#[tauri::command]
fn load_gtk_reference_summary() -> Result<GtkReferenceSummary, String> {
    let path = gtk_reference_summary_path()?;
    let data = std::fs::read_to_string(&path)
        .map_err(|err| format!("gtk_reference_summary_read_failed:{}:{err}", path.display()))?;
    serde_json::from_str(&data)
        .map_err(|err| format!("gtk_reference_summary_parse_failed:{}:{err}", path.display()))
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
        .manage(ViewerManager::default())
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
            venner_core::commands::get_compiled_gtk_theme,
            venner_core::commands::get_compiled_gtk_theme_diagnostics,
            viewer_spawn,
            viewer_stop,
            viewer_send,
            viewer_list,
            viewer_poll_logs,
            viewer_load_manifest,
            load_gtk_reference_summary,
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
