//! Live theme monitoring via gsettings monitor; emits theme:changed on relevant key changes.

use super::parser_gtk3;
use super::parser_gtk4;
use super::path;
use super::resolver::{self, ColorScheme, ThemeGtkVersion};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::thread;

/// Load current theme: project (dev/test) → system → default tokens.
pub fn load_theme_tokens() -> HashMap<String, String> {
    let settings = resolver::read_theme_settings();

    if let Some(base) = path::project_themes_dir() {
        if let Some((path, version)) =
            path::resolve_project_theme(&base, &settings.gtk_theme, settings.color_scheme)
        {
            if let Ok(css) = std::fs::read_to_string(&path) {
                let tokens = match version {
                    ThemeGtkVersion::Gtk4 => parser_gtk4::parse_gtk4_css(&css),
                    ThemeGtkVersion::Gtk3 => parser_gtk3::parse_gtk3_css(&css),
                    ThemeGtkVersion::Unknown => default_tokens(),
                };
                if !tokens.is_empty() {
                    return tokens;
                }
            }
        }
    }

    let Some((path, version)) = resolver::resolve_theme_css_path(&settings.gtk_theme, settings.color_scheme) else {
        return default_tokens();
    };
    let Ok(css) = std::fs::read_to_string(&path) else {
        return default_tokens();
    };
    let tokens = match version {
        ThemeGtkVersion::Gtk4 => parser_gtk4::parse_gtk4_css(&css),
        ThemeGtkVersion::Gtk3 => parser_gtk3::parse_gtk3_css(&css),
        ThemeGtkVersion::Unknown => default_tokens(),
    };
    if tokens.is_empty() {
        default_tokens()
    } else {
        tokens
    }
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
    m
}

/// Keys that trigger a theme reload when changed via gsettings.
const THEME_KEYS: &[&str] = &["gtk-theme", "color-scheme", "accent-color", "font-name"];

/// Start a background thread that runs `gsettings monitor SCHEMA` and emits `theme:changed`
/// with fresh tokens whenever a theme-related key changes.
pub fn start_theme_monitor(app_handle: tauri::AppHandle) {
    let schema = match resolver::detect_desktop() {
        resolver::DesktopEnv::Cinnamon => "org.cinnamon.desktop.interface",
        _ => "org.gnome.desktop.interface",
    };

    thread::spawn(move || {
        let Ok(mut child) = Command::new("gsettings")
            .args(["monitor", schema])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
        else {
            return;
        };
        let Some(stdout) = child.stdout.take() else {
            return;
        };
        let reader = BufReader::new(stdout);
        for line in reader.lines().filter_map(Result::ok) {
            let key = line.split(':').next().unwrap_or("").trim();
            if THEME_KEYS.contains(&key) {
                let tokens = load_theme_tokens();
                let _ = app_handle.emit("theme:changed", &tokens);
            }
        }
    });
}
