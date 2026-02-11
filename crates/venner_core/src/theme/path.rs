//! Projektowa ścieżka motywów (dev/test) vs system.
//!
//! Struktura resources/themes:
//! - default-gtk3/  (gtk-contained.css, gtk-contained-dark.css)
//! - default-gtk4/  (Default-dark.css, Default-light.css)
//! - mint-l-dark-sand-gtk3/ (gtk.css, gtk-dark.css)

use std::path::{Path, PathBuf};

use super::resolver::{ColorScheme, ThemeGtkVersion};

/// Nazwa zmiennej środowiskowej nadpisującej ścieżkę do motywów projektu.
pub const VENNER_THEMES_DIR: &str = "VENNER_THEMES_DIR";

/// Wybór motywu projektu (VENNER_DEV_THEME): default-gtk3, default-gtk4, mint-l-dark-sand-gtk3.
pub const VENNER_DEV_THEME: &str = "VENNER_DEV_THEME";

/// Zwraca ścieżkę do `resources/themes` w workspace (dla dev/test).
pub fn project_themes_dir() -> Option<PathBuf> {
    if let Some(dir) = std::env::var_os(VENNER_THEMES_DIR) {
        let path = PathBuf::from(dir);
        if path.is_dir() {
            return Some(path);
        }
    }

    let mut dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    for _ in 0..6 {
        let themes = dir.join("resources").join("themes");
        if themes.is_dir() {
            return Some(themes);
        }
        dir = dir.parent()?.to_path_buf();
    }
    None
}

/// Mapuje gtk_theme z gsettings na podkatalog resources/themes.
fn project_theme_subdir(gtk_theme: &str) -> &'static str {
    if let Ok(t) = std::env::var(VENNER_DEV_THEME) {
        match t.as_str() {
            "default-gtk3" => return "default-gtk3",
            "default-gtk4" => return "default-gtk4",
            "mint-l-dark-sand-gtk3" => return "mint-l-dark-sand-gtk3",
            _ => {}
        }
    }
    let lower = gtk_theme.to_lowercase();
    if lower.contains("mint") {
        "mint-l-dark-sand-gtk3"
    } else {
        "default-gtk4"
    }
}

/// Ścieżka do pliku CSS i wariant wg color_scheme dla danego podkatalogu.
fn project_theme_filename(subdir: &str, color_scheme: ColorScheme) -> (&'static str, ThemeGtkVersion) {
    match subdir {
        "default-gtk4" => (
            match color_scheme {
                ColorScheme::PreferDark => "Default-dark.css",
                ColorScheme::PreferLight => "Default-light.css",
                ColorScheme::Default => "Default-dark.css",
            },
            ThemeGtkVersion::Gtk4,
        ),
        "default-gtk3" => (
            match color_scheme {
                ColorScheme::PreferDark => "gtk-contained-dark.css",
                ColorScheme::PreferLight => "gtk-contained.css",
                ColorScheme::Default => "gtk-contained-dark.css",
            },
            ThemeGtkVersion::Gtk3,
        ),
        "mint-l-dark-sand-gtk3" => (
            match color_scheme {
                ColorScheme::PreferDark => "gtk-dark.css",
                ColorScheme::PreferLight => "gtk.css",
                ColorScheme::Default => "gtk.css",
            },
            ThemeGtkVersion::Gtk3,
        ),
        _ => ("Default-dark.css", ThemeGtkVersion::Gtk4),
    }
}

/// Zwraca ścieżkę do pliku CSS z projektu i wersję GTK, jeśli dostępne.
pub fn resolve_project_theme(
    base: &Path,
    gtk_theme: &str,
    color_scheme: ColorScheme,
) -> Option<(PathBuf, ThemeGtkVersion)> {
    let subdir = project_theme_subdir(gtk_theme);
    let theme_dir = base.join(subdir);
    if !theme_dir.is_dir() {
        return None;
    }
    let (filename, version) = project_theme_filename(subdir, color_scheme);
    let path = theme_dir.join(filename);
    if path.exists() {
        Some((path, version))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_themes_dir_or_none() {
        let _ = project_themes_dir();
    }
}
