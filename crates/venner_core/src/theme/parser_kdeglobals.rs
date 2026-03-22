//! Parse KDE Plasma `kdeglobals` (INI) into structured colors and Venner CSS tokens.

use std::collections::HashMap;

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct KdeColorSection {
    pub background_normal: Option<String>,
    pub background_alternate: Option<String>,
    pub foreground_normal: Option<String>,
    pub foreground_inactive: Option<String>,
    pub foreground_negative: Option<String>,
    pub foreground_positive: Option<String>,
    pub foreground_neutral: Option<String>,
    pub decoration_focus: Option<String>,
    pub decoration_hover: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct KdeThemeData {
    pub button: KdeColorSection,
    pub window: KdeColorSection,
    pub view: KdeColorSection,
    pub selection: KdeColorSection,
    pub header: KdeColorSection,
    pub header_inactive: KdeColorSection,
    pub tooltip: KdeColorSection,
    pub wm_active_bg: Option<String>,
    pub wm_active_fg: Option<String>,
    pub wm_inactive_bg: Option<String>,
    pub wm_inactive_fg: Option<String>,
    pub color_scheme_name: Option<String>,
    pub contrast: Option<f32>,
}

/// Convert KDE `R,G,B` (decimal 0–255) to `#rrggbb`.
pub fn rgb_str_to_hex(rgb: &str) -> Option<String> {
    let parts: Vec<&str> = rgb.split(',').map(str::trim).collect();
    if parts.len() != 3 {
        return None;
    }
    let r: u8 = parts[0].parse().ok()?;
    let g: u8 = parts[1].parse().ok()?;
    let b: u8 = parts[2].parse().ok()?;
    Some(format!("#{r:02x}{g:02x}{b:02x}"))
}

fn window_bg_luminance(data: &KdeThemeData) -> Option<u32> {
    let rgb = data.window.background_normal.as_deref()?;
    let parts: Vec<&str> = rgb.split(',').map(str::trim).collect();
    if parts.len() != 3 {
        return None;
    }
    let r: u32 = parts[0].parse().ok()?;
    let g: u32 = parts[1].parse().ok()?;
    let b: u32 = parts[2].parse().ok()?;
    Some((r * 299 + g * 587 + b * 114) / 1000)
}

/// Heuristic dark/light from scheme name or window background luminance.
pub fn is_dark_scheme(data: &KdeThemeData) -> bool {
    if let Some(name) = data.color_scheme_name.as_deref() {
        let lower = name.to_lowercase();
        if lower.contains("dark") {
            return true;
        }
        if lower.contains("light") {
            return false;
        }
    }
    window_bg_luminance(data).is_some_and(|l| l < 128)
}

fn apply_color_key(section: &mut KdeColorSection, key: &str, value: &str) {
    match key {
        "BackgroundNormal" => section.background_normal = Some(value.to_string()),
        "BackgroundAlternate" => section.background_alternate = Some(value.to_string()),
        "ForegroundNormal" => section.foreground_normal = Some(value.to_string()),
        "ForegroundInactive" => section.foreground_inactive = Some(value.to_string()),
        "ForegroundNegative" => section.foreground_negative = Some(value.to_string()),
        "ForegroundPositive" => section.foreground_positive = Some(value.to_string()),
        "ForegroundNeutral" => section.foreground_neutral = Some(value.to_string()),
        "DecorationFocus" => section.decoration_focus = Some(value.to_string()),
        "DecorationHover" => section.decoration_hover = Some(value.to_string()),
        _ => {}
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum ActiveKdeSection {
    None,
    ColorsButton,
    ColorsWindow,
    ColorsView,
    ColorsSelection,
    ColorsHeader,
    ColorsHeaderInactive,
    ColorsTooltip,
    Wm,
    General,
    Kde,
    Other,
}

fn parse_section_header(line: &str) -> Option<ActiveKdeSection> {
    let line = line.trim();
    if !line.starts_with('[') || !line.ends_with(']') {
        return None;
    }
    let inner = &line[1..line.len() - 1];
    if inner.contains("][") {
        let parts: Vec<&str> = inner.split("][").collect();
        if parts.len() == 2 && parts[0] == "Colors:Header" && parts[1] == "Inactive" {
            return Some(ActiveKdeSection::ColorsHeaderInactive);
        }
        return Some(ActiveKdeSection::Other);
    }
    match inner {
        "Colors:Button" => Some(ActiveKdeSection::ColorsButton),
        "Colors:Window" => Some(ActiveKdeSection::ColorsWindow),
        "Colors:View" => Some(ActiveKdeSection::ColorsView),
        "Colors:Selection" => Some(ActiveKdeSection::ColorsSelection),
        "Colors:Header" => Some(ActiveKdeSection::ColorsHeader),
        "Colors:Tooltip" => Some(ActiveKdeSection::ColorsTooltip),
        "WM" => Some(ActiveKdeSection::Wm),
        "General" => Some(ActiveKdeSection::General),
        "KDE" => Some(ActiveKdeSection::Kde),
        _ => Some(ActiveKdeSection::Other),
    }
}

/// Parse `kdeglobals` INI content into [`KdeThemeData`].
pub fn parse_kdeglobals(content: &str) -> KdeThemeData {
    let mut data = KdeThemeData::default();
    let mut section = ActiveKdeSection::None;

    for raw in content.lines() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') || line.starts_with(';') {
            continue;
        }
        if let Some(next) = parse_section_header(line) {
            section = next;
            continue;
        }
        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        let key = key.trim();
        let value = value.trim();

        match &section {
            ActiveKdeSection::ColorsButton => apply_color_key(&mut data.button, key, value),
            ActiveKdeSection::ColorsWindow => apply_color_key(&mut data.window, key, value),
            ActiveKdeSection::ColorsView => apply_color_key(&mut data.view, key, value),
            ActiveKdeSection::ColorsSelection => apply_color_key(&mut data.selection, key, value),
            ActiveKdeSection::ColorsHeader => apply_color_key(&mut data.header, key, value),
            ActiveKdeSection::ColorsHeaderInactive => {
                apply_color_key(&mut data.header_inactive, key, value)
            }
            ActiveKdeSection::ColorsTooltip => apply_color_key(&mut data.tooltip, key, value),
            ActiveKdeSection::Wm => match key {
                "activeBackground" => data.wm_active_bg = Some(value.to_string()),
                "activeForeground" => data.wm_active_fg = Some(value.to_string()),
                "inactiveBackground" => data.wm_inactive_bg = Some(value.to_string()),
                "inactiveForeground" => data.wm_inactive_fg = Some(value.to_string()),
                _ => {}
            },
            ActiveKdeSection::General if key == "ColorScheme" => {
                data.color_scheme_name = Some(value.to_string());
            }
            ActiveKdeSection::Kde if key == "contrast" => {
                data.contrast = value.parse().ok();
            }
            _ => {}
        }
    }

    data
}

fn insert_hex(map: &mut HashMap<String, String>, token: &str, rgb: Option<&String>) {
    if let Some(s) = rgb {
        if let Some(hex) = rgb_str_to_hex(s) {
            map.insert(token.to_string(), hex);
        }
    }
}

/// Map parsed KDE colors to Venner `--venner-*` CSS custom properties (hex values).
pub fn map_kde_to_venner_tokens(data: &KdeThemeData) -> HashMap<String, String> {
    let mut m = HashMap::new();

    insert_hex(&mut m, "--venner-bg", data.window.background_normal.as_ref());
    insert_hex(&mut m, "--venner-fg", data.window.foreground_normal.as_ref());
    insert_hex(
        &mut m,
        "--venner-border",
        data.window.background_alternate.as_ref(),
    );

    insert_hex(
        &mut m,
        "--venner-accent",
        data.button.decoration_focus.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-btn-bg",
        data.button.background_normal.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-btn-fg",
        data.button.foreground_normal.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-btn-bg-hover",
        data.button.background_alternate.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-error",
        data.button.foreground_negative.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-success",
        data.button.foreground_positive.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-warning",
        data.button.foreground_neutral.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-disabled-fg",
        data.button.foreground_inactive.as_ref(),
    );

    insert_hex(&mut m, "--venner-base", data.view.background_normal.as_ref());
    insert_hex(
        &mut m,
        "--venner-base-fg",
        data.view.foreground_normal.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-selected-bg",
        data.selection.background_normal.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-selected-fg",
        data.selection.foreground_normal.as_ref(),
    );

    insert_hex(&mut m, "--venner-headerbar-bg", data.wm_active_bg.as_ref());
    insert_hex(&mut m, "--venner-headerbar-fg", data.wm_active_fg.as_ref());
    insert_hex(
        &mut m,
        "--venner-headerbar-bg-inactive",
        data.wm_inactive_bg.as_ref(),
    );
    insert_hex(
        &mut m,
        "--venner-headerbar-fg-inactive",
        data.wm_inactive_fg.as_ref(),
    );

    m.insert("--venner-btn-radius".to_string(), "4px".to_string());
    m.insert("--venner-btn-padding".to_string(), "5px 16px".to_string());
    m.insert("--venner-btn-min-height".to_string(), "32px".to_string());
    m.insert("--venner-entry-radius".to_string(), "4px".to_string());
    m.insert("--venner-entry-padding".to_string(), "6px 10px".to_string());
    m.insert("--venner-entry-min-height".to_string(), "32px".to_string());

    m
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rgb_str_to_hex_parses_breeze_window() {
        assert_eq!(
            rgb_str_to_hex("239,240,241"),
            Some("#eff0f1".to_string())
        );
    }

    #[test]
    fn parse_kdeglobals_extracts_wm_and_colors() {
        let ini = r#"
[Colors:Window]
BackgroundNormal=239,240,241
ForegroundNormal=35,38,41
BackgroundAlternate=227,229,231

[Colors:Button]
BackgroundNormal=252,252,252
ForegroundNormal=35,38,41
DecorationFocus=61,174,233
BackgroundAlternate=163,212,250
ForegroundNegative=218,68,83
ForegroundPositive=39,174,96
ForegroundNeutral=246,116,0
ForegroundInactive=112,125,138

[Colors:View]
BackgroundNormal=255,255,255
ForegroundNormal=35,38,41

[Colors:Selection]
BackgroundNormal=61,174,233
ForegroundNormal=255,255,255

[WM]
activeBackground=227,229,231
activeForeground=35,38,41
inactiveBackground=239,240,241
inactiveForeground=112,125,138

[General]
ColorScheme=BreezeLight

[KDE]
contrast=4
"#;
        let data = parse_kdeglobals(ini);
        assert_eq!(data.window.background_normal.as_deref(), Some("239,240,241"));
        assert_eq!(data.wm_active_bg.as_deref(), Some("227,229,231"));
        assert_eq!(data.color_scheme_name.as_deref(), Some("BreezeLight"));
        assert_eq!(data.contrast, Some(4.0));
    }

    #[test]
    fn parse_colors_header_inactive() {
        let ini = r#"
[Colors:Header]
BackgroundNormal=222,224,226

[Colors:Header][Inactive]
BackgroundNormal=239,240,241
"#;
        let data = parse_kdeglobals(ini);
        assert_eq!(data.header.background_normal.as_deref(), Some("222,224,226"));
        assert_eq!(
            data.header_inactive.background_normal.as_deref(),
            Some("239,240,241")
        );
    }

    #[test]
    fn map_kde_to_venner_tokens_covers_keys() {
        let ini = r#"
[Colors:Window]
BackgroundNormal=239,240,241
ForegroundNormal=35,38,41
BackgroundAlternate=227,229,231
[Colors:Button]
DecorationFocus=61,174,233
BackgroundNormal=252,252,252
ForegroundNormal=35,38,41
BackgroundAlternate=163,212,250
ForegroundNegative=218,68,83
ForegroundPositive=39,174,96
ForegroundNeutral=246,116,0
ForegroundInactive=112,125,138
[Colors:View]
BackgroundNormal=255,255,255
ForegroundNormal=35,38,41
[Colors:Selection]
BackgroundNormal=61,174,233
ForegroundNormal=255,255,255
[WM]
activeBackground=227,229,231
activeForeground=35,38,41
inactiveBackground=239,240,241
inactiveForeground=112,125,138
"#;
        let data = parse_kdeglobals(ini);
        let tokens = map_kde_to_venner_tokens(&data);
        assert_eq!(tokens.get("--venner-bg"), Some(&"#eff0f1".to_string()));
        assert_eq!(tokens.get("--venner-accent"), Some(&"#3daee9".to_string()));
        assert_eq!(tokens.get("--venner-btn-radius"), Some(&"4px".to_string()));
        assert!(!is_dark_scheme(&data));
    }

    #[test]
    fn is_dark_scheme_from_name() {
        let mut data = KdeThemeData::default();
        data.color_scheme_name = Some("BreezeDark".to_string());
        assert!(is_dark_scheme(&data));
    }
}
