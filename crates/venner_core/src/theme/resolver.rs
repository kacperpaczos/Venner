//! Theme resolver: desktop detection, gsettings read, CSS path resolution.

use std::path::{Path, PathBuf};
use std::process::Command;
use std::str::FromStr;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DesktopEnv {
    Gnome,
    Cinnamon,
    Kde,
    Xfce,
    Unknown(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColorScheme {
    Default,
    PreferDark,
    PreferLight,
}

#[derive(Debug, Clone)]
pub struct ThemeSettings {
    pub gtk_theme: String,
    pub color_scheme: ColorScheme,
    pub accent_color: Option<String>,
    pub font_name: String,
    pub icon_theme: String,
    pub cursor_theme: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThemeGtkVersion {
    Gtk4,
    Gtk3,
    Unknown,
}

pub fn detect_desktop() -> DesktopEnv {
    let xdg = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();
    let first = xdg.split(':').next().unwrap_or("").trim();
    match first {
        "GNOME" | "GNOME-Classic" => DesktopEnv::Gnome,
        "X-Cinnamon" => DesktopEnv::Cinnamon,
        "KDE" => DesktopEnv::Kde,
        "XFCE" => DesktopEnv::Xfce,
        other => DesktopEnv::Unknown(other.to_string()),
    }
}

fn gsettings_get(schema: &str, key: &str) -> Option<String> {
    let out = Command::new("gsettings").args(["get", schema, key]).output().ok()?;
    if !out.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&out.stdout).trim().trim_matches('\'').to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

pub fn read_theme_settings() -> ThemeSettings {
    let desktop = detect_desktop();
    let (schema, has_color_scheme, has_accent) = match desktop {
        DesktopEnv::Cinnamon => ("org.cinnamon.desktop.interface", false, false),
        _ => ("org.gnome.desktop.interface", true, true),
    };

    let gtk_theme = gsettings_get(schema, "gtk-theme")
        .or_else(|| std::env::var("GTK_THEME").ok())
        .unwrap_or_else(|| "Adwaita".to_string());

    let color_scheme = if has_color_scheme {
        gsettings_get(schema, "color-scheme")
            .as_deref()
            .and_then(|s| s.parse().ok())
            .unwrap_or(ColorScheme::Default)
    } else {
        if gtk_theme.to_lowercase().contains("-dark") {
            ColorScheme::PreferDark
        } else {
            ColorScheme::Default
        }
    };

    let accent_color = if has_accent { gsettings_get(schema, "accent-color") } else { None };
    let font_name = gsettings_get(schema, "font-name").unwrap_or_else(|| "Sans 11".to_string());
    let icon_theme = gsettings_get(schema, "icon-theme").unwrap_or_else(|| "Adwaita".to_string());
    let cursor_theme = gsettings_get(schema, "cursor-theme").unwrap_or_else(|| "Adwaita".to_string());

    ThemeSettings {
        gtk_theme,
        color_scheme,
        accent_color,
        font_name,
        icon_theme,
        cursor_theme,
    }
}

impl FromStr for ColorScheme {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "prefer-dark" => Ok(ColorScheme::PreferDark),
            "prefer-light" => Ok(ColorScheme::PreferLight),
            _ => Ok(ColorScheme::Default),
        }
    }
}

fn theme_search_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if let Some(data_home) = dirs::data_local_dir().or_else(dirs::data_dir) {
        dirs.push(data_home.join("themes"));
    }
    if let Some(home) = dirs::home_dir() {
        dirs.push(home.join(".themes"));
    }
    if let Some(data_dirs) = std::env::var_os("XDG_DATA_DIRS") {
        for p in std::env::split_paths(&data_dirs) {
            dirs.push(p.join("themes"));
        }
    }
    dirs.push(PathBuf::from("/usr/share/themes"));
    dirs
}

pub fn detect_theme_gtk_version(theme_dir: &Path) -> ThemeGtkVersion {
    if theme_dir.join("gtk-4.0").exists() {
        ThemeGtkVersion::Gtk4
    } else if theme_dir.join("gtk-3.0").exists() {
        ThemeGtkVersion::Gtk3
    } else {
        ThemeGtkVersion::Unknown
    }
}

pub fn resolve_theme_css_path(theme_name: &str, color_scheme: ColorScheme) -> Option<(PathBuf, ThemeGtkVersion)> {
    let variant = match color_scheme {
        ColorScheme::PreferDark => "gtk-dark.css",
        ColorScheme::PreferLight => "gtk-light.css",
        ColorScheme::Default => "gtk.css",
    };

    for base in theme_search_dirs() {
        let theme_dir = base.join(theme_name);
        if !theme_dir.is_dir() {
            continue;
        }
        let version = detect_theme_gtk_version(&theme_dir);
        match version {
            ThemeGtkVersion::Gtk4 => {
                let p = theme_dir.join("gtk-4.0").join(variant);
                if p.exists() {
                    return Some((p, ThemeGtkVersion::Gtk4));
                }
                let fallback = theme_dir.join("gtk-4.0").join("gtk.css");
                if fallback.exists() {
                    return Some((fallback, ThemeGtkVersion::Gtk4));
                }
            }
            ThemeGtkVersion::Gtk3 => {
                let p = theme_dir.join("gtk-3.0").join(variant);
                if p.exists() {
                    return Some((p, ThemeGtkVersion::Gtk3));
                }
                let fallback = theme_dir.join("gtk-3.0").join("gtk.css");
                if fallback.exists() {
                    return Some((fallback, ThemeGtkVersion::Gtk3));
                }
            }
            ThemeGtkVersion::Unknown => {}
        }
    }
    None
}

/// Read display name from theme's index.theme if present (e.g. "Mint-L-Dark-Sand").
pub fn theme_display_name(theme_name: &str) -> Option<String> {
    for base in theme_search_dirs() {
        let index = base.join(theme_name).join("index.theme");
        let content = std::fs::read_to_string(&index).ok()?;
        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("Name=") {
                return Some(line.strip_prefix("Name=")?.trim().to_string());
            }
        }
    }
    None
}
