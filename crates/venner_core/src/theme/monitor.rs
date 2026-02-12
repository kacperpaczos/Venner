//! Live theme monitoring via gsettings monitor; emits theme:changed on relevant key changes.

use super::parser_gtk3;
use super::parser_gtk4;
use super::path;
use super::resolver::{self, ColorScheme, ThemeGtkVersion};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

#[derive(Debug, Clone, Serialize)]
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
}

/// Load current theme tokens and diagnostics: system -> project fallback -> defaults.
pub fn load_theme_with_diagnostics() -> (HashMap<String, String>, ThemeDiagnostics) {
    let settings = resolver::read_theme_settings();
    let now = unix_ts();

    let mut fallback_reason: Option<String> = None;

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
                fallback_reason = Some(format!(
                    "system_theme_parsed_empty:path={} gtk={}",
                    path.display(),
                    version
                ));
            }
            Err(err) => {
                fallback_reason = Some(format!(
                    "system_theme_read_failed:path={} err={err}",
                    path.display()
                ));
            }
        }
    } else {
        fallback_reason = Some(format!(
            "system_theme_not_found:theme={} scheme={}",
            settings.gtk_theme,
            color_scheme_label(settings.color_scheme)
        ));
    }

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

fn parse_tokens(css: &str, version: ThemeGtkVersion) -> HashMap<String, String> {
    match version {
        ThemeGtkVersion::Gtk4 => parser_gtk4::parse_gtk4_css(css),
        ThemeGtkVersion::Gtk3 => parser_gtk3::parse_gtk3_css(css),
        ThemeGtkVersion::Unknown => HashMap::new(),
    }
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
                let (tokens, diagnostics) = load_theme_with_diagnostics();
                let _ = app_handle.emit("theme:changed", &tokens);
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
