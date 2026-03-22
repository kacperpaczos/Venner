//! Live theme monitoring via gsettings monitor; emits theme:changed on relevant key changes.

use super::parser_gtk3;
use super::parser_gtk4;
use super::parser_gtk4_widgets;
use super::parser_gtk4_window;
use super::parser_kdeglobals;
use super::path;
use super::resolver::{self, ColorScheme, DesktopEnv, ThemeGtkVersion};
use crate::theme::compiled_theme::{
    build_meta, BackdropTheme, ButtonTheme, CompiledGtkTheme, EntryTheme, HeaderbarTheme,
    WidgetsTheme, WindowControlsTheme, WindowLayoutTheme, WindowTheme,
};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ThemeCoverageWindow {
    pub headerbar: f32,
    pub windowcontrols: f32,
    pub title_buttons: f32,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ThemeCoverage {
    pub window: ThemeCoverageWindow,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeDiagnostics {
    pub desktop_env: String,
    pub schema: String,
    pub gtk_theme: String,
    pub color_scheme: String,
    pub source: String,
    pub resolved_css_path: Option<String>,
    pub resolved_gtk_version: String,
    pub fallback_reason: Option<String>,
    pub tokens_count: usize,
    pub loaded_at: u64,
    pub coverage: ThemeCoverage,
    pub missing_selectors: Vec<String>,
    pub missing_props: Vec<String>,
}

impl ThemeDiagnostics {
    fn with_empty_coverage(self) -> Self {
        Self {
            coverage: ThemeCoverage::default(),
            missing_selectors: Vec::new(),
            missing_props: Vec::new(),
            ..self
        }
    }
}

/// Load current theme tokens and diagnostics: system -> project fallback -> defaults.
pub fn load_theme_with_diagnostics() -> (HashMap<String, String>, ThemeDiagnostics) {
    if resolver::detect_desktop() == DesktopEnv::Kde {
        return load_kde_theme_with_diagnostics();
    }

    let settings = resolver::read_theme_settings();
    let now = unix_ts();

    let system_resolved =
        resolver::resolve_theme_css_path(&settings.gtk_theme, settings.color_scheme);
    if let Some((path, version)) = system_resolved {
        match std::fs::read_to_string(&path) {
            Ok(css) => {
                let tokens = parse_tokens(&css, version);
                if !tokens.is_empty() {
                    let diagnostics = ThemeDiagnostics {
                        desktop_env: settings.desktop_env.to_string(),
                        schema: settings.schema,
                        gtk_theme: settings.gtk_theme,
                        color_scheme: color_scheme_label(settings.color_scheme),
                        source: "system".to_string(),
                        resolved_css_path: Some(path.display().to_string()),
                        resolved_gtk_version: version.to_string(),
                        fallback_reason: None,
                        tokens_count: tokens.len(),
                        loaded_at: now,
                        coverage: ThemeCoverage::default(),
                        missing_selectors: Vec::new(),
                        missing_props: Vec::new(),
                    };
                    log::info!(
                        "[theme] source=system theme={} scheme={} path={} gtk={} tokens={}",
                        diagnostics.gtk_theme,
                        diagnostics.color_scheme,
                        diagnostics.resolved_css_path.as_deref().unwrap_or("<none>"),
                        diagnostics.resolved_gtk_version,
                        diagnostics.tokens_count,
                    );
                    return (tokens, diagnostics);
                }
                let fallback_reason = Some(format!(
                    "system_theme_parsed_empty:path={} gtk={}",
                    path.display(),
                    version
                ));
                return try_project_or_default(settings, now, fallback_reason);
            }
            Err(err) => {
                let fallback_reason = Some(format!(
                    "system_theme_read_failed:path={} err={err}",
                    path.display()
                ));
                return try_project_or_default(settings, now, fallback_reason);
            }
        }
    } else {
        let fallback_reason = Some(format!(
            "system_theme_not_found:theme={} scheme={}",
            settings.gtk_theme,
            color_scheme_label(settings.color_scheme)
        ));
        return try_project_or_default(settings, now, fallback_reason);
    }
}

fn try_project_or_default(
    settings: resolver::ThemeSettings,
    now: u64,
    mut fallback_reason: Option<String>,
) -> (HashMap<String, String>, ThemeDiagnostics) {
    if let Some(base) = path::project_themes_dir() {
        if let Some((project_css, version)) =
            path::resolve_project_theme(&base, &settings.gtk_theme, settings.color_scheme)
        {
            match std::fs::read_to_string(&project_css) {
                Ok(css) => {
                    let tokens = parse_tokens(&css, version);
                    if !tokens.is_empty() {
                        let diagnostics = ThemeDiagnostics {
                            desktop_env: settings.desktop_env.to_string(),
                            schema: settings.schema,
                            gtk_theme: settings.gtk_theme,
                            color_scheme: color_scheme_label(settings.color_scheme),
                            source: "project".to_string(),
                            resolved_css_path: Some(project_css.display().to_string()),
                            resolved_gtk_version: version.to_string(),
                            fallback_reason,
                            tokens_count: tokens.len(),
                            loaded_at: now,
                            coverage: ThemeCoverage::default(),
                            missing_selectors: Vec::new(),
                            missing_props: Vec::new(),
                        };
                        log::warn!(
                            "[theme] source=project_fallback theme={} scheme={} path={} gtk={} tokens={} reason={}",
                            diagnostics.gtk_theme,
                            diagnostics.color_scheme,
                            diagnostics
                                .resolved_css_path
                                .as_deref()
                                .unwrap_or("<none>"),
                            diagnostics.resolved_gtk_version,
                            diagnostics.tokens_count,
                            diagnostics
                                .fallback_reason
                                .as_deref()
                                .unwrap_or("unknown"),
                        );
                        return (tokens, diagnostics);
                    }
                    fallback_reason = Some(format!(
                        "project_theme_parsed_empty:path={} gtk={}",
                        project_css.display(),
                        version
                    ));
                }
                Err(err) => {
                    fallback_reason = Some(format!(
                        "project_theme_read_failed:path={} err={err}",
                        project_css.display()
                    ));
                }
            }
        }
    }

    let tokens = default_tokens();
    let diagnostics = ThemeDiagnostics {
        desktop_env: settings.desktop_env.to_string(),
        schema: settings.schema,
        gtk_theme: settings.gtk_theme,
        color_scheme: color_scheme_label(settings.color_scheme),
        source: "default".to_string(),
        resolved_css_path: None,
        resolved_gtk_version: ThemeGtkVersion::Unknown.to_string(),
        fallback_reason,
        tokens_count: tokens.len(),
        loaded_at: now,
        coverage: ThemeCoverage::default(),
        missing_selectors: Vec::new(),
        missing_props: Vec::new(),
    };

    log::warn!(
        "[theme] source=default theme={} scheme={} tokens={} reason={}",
        diagnostics.gtk_theme,
        diagnostics.color_scheme,
        diagnostics.tokens_count,
        diagnostics
            .fallback_reason
            .as_deref()
            .unwrap_or("no_reason"),
    );

    (tokens, diagnostics)
}

/// Backward-compatible helper returning only tokens.
pub fn load_theme_tokens() -> HashMap<String, String> {
    load_theme_with_diagnostics().0
}

/// Load compiled theme contract (tokens + window/widgets sections) and diagnostics.
pub fn load_compiled_theme_with_diagnostics() -> (CompiledGtkTheme, ThemeDiagnostics) {
    if resolver::detect_desktop() == DesktopEnv::Kde {
        return load_compiled_kde_theme_with_diagnostics();
    }

    let (tokens, diagnostics) = load_theme_with_diagnostics();
    let version = match diagnostics.resolved_gtk_version.as_str() {
        "gtk4" => ThemeGtkVersion::Gtk4,
        "gtk3" => ThemeGtkVersion::Gtk3,
        _ => ThemeGtkVersion::Unknown,
    };

    let (window, widgets, hash_input, parse_report) = if version == ThemeGtkVersion::Gtk4 {
        if let Some(path) = diagnostics.resolved_css_path.as_ref() {
            if let Ok(css) = std::fs::read_to_string(path) {
                let (window, report) = parser_gtk4_window::parse_gtk4_window_css_with_report(&css);
                (
                    window,
                    parser_gtk4_widgets::parse_gtk4_widgets_css(&css),
                    css,
                    Some(report),
                )
            } else {
                (
                    Default::default(),
                    Default::default(),
                    format!("{:?}{:?}", tokens, diagnostics.resolved_css_path),
                    None,
                )
            }
        } else {
            (
                Default::default(),
                Default::default(),
                format!("{:?}{:?}", tokens, diagnostics.source),
                None,
            )
        }
    } else {
        (
            Default::default(),
            Default::default(),
            format!("{:?}{:?}", tokens, diagnostics.source),
            None,
        )
    };

    let diagnostics = if let Some(report) = parse_report {
        ThemeDiagnostics {
            coverage: ThemeCoverage {
                window: ThemeCoverageWindow {
                    headerbar: report.headerbar_coverage,
                    windowcontrols: report.windowcontrols_coverage,
                    title_buttons: report.titlebuttons_coverage,
                },
            },
            missing_selectors: report.missing_selectors,
            missing_props: report.missing_props,
            ..diagnostics
        }
    } else {
        diagnostics.with_empty_coverage()
    };

    let compiled = CompiledGtkTheme {
        tokens,
        window,
        widgets,
        meta: build_meta(&diagnostics, version, &hash_input),
    };
    (compiled, diagnostics)
}

fn parse_tokens(css: &str, version: ThemeGtkVersion) -> HashMap<String, String> {
    match version {
        ThemeGtkVersion::Gtk4 => parser_gtk4::parse_gtk4_css(css),
        ThemeGtkVersion::Gtk3 => parser_gtk3::parse_gtk3_css(css),
        ThemeGtkVersion::Unknown => HashMap::new(),
    }
}

fn merge_kde_token_defaults(tokens: &mut HashMap<String, String>) {
    for (k, v) in default_tokens() {
        tokens.entry(k).or_insert(v);
    }
    if !tokens.contains_key("--venner-headerbar-bg") {
        if let Some(bg) = tokens.get("--venner-bg").cloned() {
            tokens
                .entry("--venner-headerbar-bg".to_string())
                .or_insert(bg.clone());
            tokens
                .entry("--venner-headerbar-bg-inactive".to_string())
                .or_insert(bg);
        }
    }
    if !tokens.contains_key("--venner-headerbar-fg") {
        if let Some(fg) = tokens.get("--venner-fg").cloned() {
            tokens
                .entry("--venner-headerbar-fg".to_string())
                .or_insert(fg.clone());
            tokens
                .entry("--venner-headerbar-fg-inactive".to_string())
                .or_insert(fg);
        }
    }
}

fn kde_hex(rgb: Option<&String>) -> Option<String> {
    rgb.and_then(|s| parser_kdeglobals::rgb_str_to_hex(s))
}

fn build_kde_window_theme(data: &parser_kdeglobals::KdeThemeData) -> WindowTheme {
    WindowTheme {
        headerbar: HeaderbarTheme {
            background_color: kde_hex(data.wm_active_bg.as_ref()),
            border_color: kde_hex(data.window.background_alternate.as_ref()),
            min_height: Some("46px".to_string()),
            ..Default::default()
        },
        windowcontrols: WindowControlsTheme {
            spacing: Some("4px".to_string()),
            button_min_width: Some("24px".to_string()),
            button_min_height: Some("24px".to_string()),
            ..Default::default()
        },
        layout: WindowLayoutTheme {
            controls_spacing: Some("4px".to_string()),
            ..Default::default()
        },
        backdrop: BackdropTheme {
            headerbar_color: kde_hex(data.wm_inactive_fg.as_ref()),
            maximize_color: kde_hex(data.wm_inactive_fg.as_ref()),
            minimize_color: kde_hex(data.wm_inactive_fg.as_ref()),
            ..Default::default()
        },
        ..Default::default()
    }
}

fn build_kde_widgets_theme(data: &parser_kdeglobals::KdeThemeData) -> WidgetsTheme {
    WidgetsTheme {
        button: ButtonTheme {
            min_height: Some("32px".to_string()),
            padding: Some("5px 16px".to_string()),
            border_radius: Some("4px".to_string()),
            border_color: kde_hex(data.button.decoration_focus.as_ref()),
            background_color: kde_hex(data.button.background_normal.as_ref()),
            color: kde_hex(data.button.foreground_normal.as_ref()),
            hover_border_color: kde_hex(data.button.decoration_hover.as_ref()),
            hover_background_color: kde_hex(data.button.background_alternate.as_ref()),
            active_border_color: kde_hex(data.button.decoration_focus.as_ref()),
            active_background_color: kde_hex(data.button.decoration_hover.as_ref()),
            disabled_color: kde_hex(data.button.foreground_inactive.as_ref()),
            disabled_border_color: kde_hex(data.button.background_alternate.as_ref()),
            disabled_background_color: kde_hex(data.button.background_normal.as_ref()),
            ..Default::default()
        },
        entry: EntryTheme {
            min_height: Some("32px".to_string()),
            padding: Some("6px 10px".to_string()),
            border_radius: Some("4px".to_string()),
            border_color: kde_hex(data.view.background_alternate.as_ref()),
            background_color: kde_hex(data.view.background_normal.as_ref()),
            color: kde_hex(data.view.foreground_normal.as_ref()),
            focus_border_color: kde_hex(data.selection.background_normal.as_ref()),
            disabled_color: kde_hex(data.button.foreground_inactive.as_ref()),
            disabled_background_color: kde_hex(data.view.background_alternate.as_ref()),
            ..Default::default()
        },
    }
}

fn load_kde_theme_with_diagnostics() -> (HashMap<String, String>, ThemeDiagnostics) {
    let now = unix_ts();
    let gtk_ini = resolver::read_gtk3_settings_ini();
    let gtk_bridge_theme = gtk_ini
        .get("theme-name")
        .cloned()
        .unwrap_or_else(|| "Breeze".to_string());

    let path_opt = resolver::kdeglobals_path();

    if let Some(ref path) = path_opt {
        if let Ok(content) = std::fs::read_to_string(path) {
            let data = parser_kdeglobals::parse_kdeglobals(&content);
            let mut tokens = parser_kdeglobals::map_kde_to_venner_tokens(&data);
            merge_kde_token_defaults(&mut tokens);

            let color_scheme = if parser_kdeglobals::is_dark_scheme(&data) {
                "prefer-dark"
            } else {
                "default"
            };
            let theme_label = data
                .color_scheme_name
                .clone()
                .unwrap_or_else(|| gtk_bridge_theme.clone());

            let diagnostics = ThemeDiagnostics {
                desktop_env: "kde".to_string(),
                schema: "kdeglobals".to_string(),
                gtk_theme: theme_label,
                color_scheme: color_scheme.to_string(),
                source: "system".to_string(),
                resolved_css_path: Some(path.display().to_string()),
                resolved_gtk_version: "kde".to_string(),
                fallback_reason: None,
                tokens_count: tokens.len(),
                loaded_at: now,
                coverage: ThemeCoverage::default(),
                missing_selectors: Vec::new(),
                missing_props: Vec::new(),
            };
            log::info!(
                "[theme] source=kde_system path={} gtk_bridge={} tokens={}",
                path.display(),
                gtk_bridge_theme,
                diagnostics.tokens_count,
            );
            return (tokens, diagnostics);
        }
    }

    let mut tokens = default_tokens();
    merge_kde_token_defaults(&mut tokens);
    let fallback_reason = path_opt.as_ref().map(|p| {
        format!(
            "kdeglobals_unavailable:path={}",
            p.display()
        )
    });

    let diagnostics = ThemeDiagnostics {
        desktop_env: "kde".to_string(),
        schema: "kdeglobals".to_string(),
        gtk_theme: gtk_bridge_theme.clone(),
        color_scheme: "default".to_string(),
        source: "default".to_string(),
        resolved_css_path: path_opt.as_ref().map(|p| p.display().to_string()),
        resolved_gtk_version: "kde".to_string(),
        fallback_reason,
        tokens_count: tokens.len(),
        loaded_at: now,
        coverage: ThemeCoverage::default(),
        missing_selectors: Vec::new(),
        missing_props: Vec::new(),
    };

    log::warn!(
        "[theme] source=kde_default gtk_bridge={} tokens={}",
        gtk_bridge_theme,
        diagnostics.tokens_count,
    );

    (tokens, diagnostics)
}

/// Load compiled theme on KDE from `kdeglobals` + GTK settings.ini bridge.
pub fn load_compiled_kde_theme_with_diagnostics() -> (CompiledGtkTheme, ThemeDiagnostics) {
    let (tokens, diagnostics) = load_kde_theme_with_diagnostics();

    let data = if diagnostics.source == "system" {
        diagnostics
            .resolved_css_path
            .as_ref()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .map(|c| parser_kdeglobals::parse_kdeglobals(&c))
            .unwrap_or_default()
    } else {
        parser_kdeglobals::KdeThemeData::default()
    };

    let window = build_kde_window_theme(&data);
    let widgets = build_kde_widgets_theme(&data);
    let hash_input = format!("kde:{:?}{:?}", tokens, diagnostics.gtk_theme);
    let version = ThemeGtkVersion::Unknown;

    let compiled = CompiledGtkTheme {
        tokens,
        window,
        widgets,
        meta: build_meta(&diagnostics, version, &hash_input),
    };

    let diagnostics = diagnostics.with_empty_coverage();
    (compiled, diagnostics)
}

/// Poll `kdeglobals` mtime and emit the same theme events as the GTK monitor.
pub fn start_kde_theme_monitor(app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        let Some(path) = resolver::kdeglobals_path() else {
            log::warn!("[theme] kde_monitor_no_config_dir");
            return;
        };

        let mut last_mtime: Option<SystemTime> = None;
        loop {
            thread::sleep(Duration::from_secs(2));
            match std::fs::metadata(&path) {
                Ok(meta) => {
                    let mtime = meta.modified().ok();
                    if last_mtime.is_some() && mtime != last_mtime {
                        let (compiled, diagnostics) = load_compiled_kde_theme_with_diagnostics();
                        let _ = app_handle.emit("theme:changed", &compiled.tokens);
                        let _ = app_handle.emit("theme:compiled-changed", &compiled);
                        let _ = app_handle.emit("theme:diagnostics", &diagnostics);
                        log::info!(
                            "[theme] kde_changed path={} tokens={}",
                            path.display(),
                            diagnostics.tokens_count,
                        );
                    }
                    last_mtime = mtime;
                }
                Err(_) => {}
            }
        }
    });
}

fn color_scheme_label(scheme: ColorScheme) -> String {
    match scheme {
        ColorScheme::Default => "default".to_string(),
        ColorScheme::PreferDark => "prefer-dark".to_string(),
        ColorScheme::PreferLight => "prefer-light".to_string(),
    }
}

fn unix_ts() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn default_tokens() -> HashMap<String, String> {
    let mut m = HashMap::new();
    m.insert("--venner-bg".to_string(), "#353535".to_string());
    m.insert("--venner-fg".to_string(), "#eeeeec".to_string());
    m.insert("--venner-accent".to_string(), "#3584e4".to_string());
    m.insert("--venner-border".to_string(), "#1b1b1b".to_string());
    m.insert("--venner-error".to_string(), "#cc0000".to_string());
    m.insert("--venner-success".to_string(), "#26ab62".to_string());
    m.insert("--venner-warning".to_string(), "#f57900".to_string());
    m.insert("--venner-btn-bg".to_string(), "#353535".to_string());
    m.insert("--venner-btn-fg".to_string(), "#eeeeec".to_string());
    m.insert("--venner-btn-border".to_string(), "#1b1b1b".to_string());
    m.insert("--venner-btn-radius".to_string(), "5px".to_string());
    m.insert("--venner-btn-padding".to_string(), "6px 12px".to_string());
    m.insert("--venner-btn-min-height".to_string(), "34px".to_string());
    m.insert("--venner-entry-padding".to_string(), "6px 10px".to_string());
    m.insert("--venner-entry-min-height".to_string(), "34px".to_string());
    m.insert("--venner-entry-radius".to_string(), "6px".to_string());
    m
}

/// Keys that trigger a theme reload when changed via gsettings.
const THEME_KEYS: &[&str] = &["gtk-theme", "color-scheme", "accent-color", "font-name"];

/// Start a background thread that runs `gsettings monitor SCHEMA` and emits `theme:changed`
/// with fresh tokens whenever a theme-related key changes.
pub fn start_theme_monitor(app_handle: tauri::AppHandle) {
    let desktop = resolver::detect_desktop();
    if desktop == DesktopEnv::Kde {
        log::info!("[theme] monitor_start desktop=kde (poll kdeglobals)");
        start_kde_theme_monitor(app_handle);
        return;
    }

    let schema = resolver::theme_schema_for_desktop(&desktop);

    log::info!(
        "[theme] monitor_start desktop={} schema={}",
        desktop,
        schema
    );

    thread::spawn(move || {
        let Ok(mut child) = Command::new("gsettings")
            .args(["monitor", schema])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
        else {
            log::warn!("[theme] monitor_start_failed schema={schema}");
            return;
        };
        let Some(stdout) = child.stdout.take() else {
            log::warn!("[theme] monitor_no_stdout schema={schema}");
            return;
        };

        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            let key = line.split(':').next().unwrap_or("").trim();
            if THEME_KEYS.contains(&key) {
                let (compiled, diagnostics) = load_compiled_theme_with_diagnostics();
                let _ = app_handle.emit("theme:changed", &compiled.tokens);
                let _ = app_handle.emit("theme:compiled-changed", &compiled);
                let _ = app_handle.emit("theme:diagnostics", &diagnostics);
                log::info!(
                    "[theme] changed key={} source={} path={} tokens={}",
                    key,
                    diagnostics.source,
                    diagnostics.resolved_css_path.as_deref().unwrap_or("<none>"),
                    diagnostics.tokens_count,
                );
            }
        }
    });
}
