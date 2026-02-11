//! GTK3 CSS parser: @define-color with shade()/alpha() and Mint short-name normalization.

use regex::Regex;
use std::collections::HashMap;

/// Normalize Mint/custom theme short names to standard GTK names.
pub fn normalize_color_name(name: &str) -> String {
    match name {
        "fg_color" => "theme_fg_color".to_string(),
        "bg_color" => "theme_bg_color".to_string(),
        "base_color" => "theme_base_color".to_string(),
        "text_color" => "theme_text_color".to_string(),
        "selected_bg_color" => "theme_selected_bg_color".to_string(),
        "selected_fg_color" => "theme_selected_fg_color".to_string(),
        "placeholder_text_color" => "theme_unfocused_fg_color".to_string(),
        other => other.to_string(),
    }
}

/// Parse hex color to (r, g, b) u8.
fn parse_hex(hex: &str) -> Option<(u8, u8, u8)> {
    let s = hex.trim().trim_start_matches('#');
    if s.len() == 6 {
        let r = u8::from_str_radix(&s[0..2], 16).ok()?;
        let g = u8::from_str_radix(&s[2..4], 16).ok()?;
        let b = u8::from_str_radix(&s[4..6], 16).ok()?;
        return Some((r, g, b));
    }
    if s.len() == 3 {
        let r = u8::from_str_radix(&s[0..1].repeat(2), 16).ok()?;
        let g = u8::from_str_radix(&s[1..2].repeat(2), 16).ok()?;
        let b = u8::from_str_radix(&s[2..3].repeat(2), 16).ok()?;
        return Some((r, g, b));
    }
    None
}

/// Eval GTK3 shade(color, factor). factor > 1 = lighten, < 1 = darken.
pub fn eval_shade(color: &str, factor: f64) -> Option<String> {
    let (r, g, b) = parse_hex(color)?;
    let r = (f64::from(r) * factor).clamp(0., 255.) as u8;
    let g = (f64::from(g) * factor).clamp(0., 255.) as u8;
    let b = (f64::from(b) * factor).clamp(0., 255.) as u8;
    Some(format!("#{:02x}{:02x}{:02x}", r, g, b))
}

/// Eval GTK3 alpha(color, amount). Returns rgba() string.
pub fn eval_alpha(color: &str, alpha: f64) -> Option<String> {
    let color = color.trim().to_lowercase();
    let a = alpha.clamp(0., 1.);
    if color == "black" || color == "rgb(0,0,0)" {
        return Some(format!("rgba(0, 0, 0, {:.2})", a));
    }
    if color == "white" || color == "rgb(255,255,255)" {
        return Some(format!("rgba(255, 255, 255, {:.2})", a));
    }
    if let Some((r, g, b)) = parse_hex(color.trim_start_matches('#')) {
        return Some(format!("rgba({}, {}, {}, {:.2})", r, g, b, a));
    }
    None
}

/// Resolve a single GTK3 color value (hex, shade(), alpha(), or pass-through).
fn resolve_value(value: &str) -> String {
    let value = value.trim();
    let shade_re = Regex::new(r"shade\s*\(\s*([^,)]+)\s*,\s*([\d.]+)\s*\)").unwrap();
    let alpha_re = Regex::new(r"alpha\s*\(\s*(\w+)\s*,\s*([\d.]+)\s*\)").unwrap();

    if let Some(cap) = shade_re.captures(value) {
        let color = cap[1].trim().trim_start_matches('#');
        let hex = if color.starts_with('#') { color.to_string() } else { format!("#{}", color) };
        let factor: f64 = cap[2].parse().unwrap_or(1.0);
        if let Some(s) = eval_shade(&hex, factor) {
            return s;
        }
    }
    if let Some(cap) = alpha_re.captures(value) {
        let color = cap[1].trim();
        let alpha: f64 = cap[2].parse().unwrap_or(0.5);
        if let Some(s) = eval_alpha(color, alpha) {
            return s;
        }
    }
    value.to_string()
}

/// Parse @define-color from GTK3 CSS; normalize names and resolve shade/alpha.
pub fn parse_define_colors(css: &str) -> HashMap<String, String> {
    let re = Regex::new(r"@define-color\s+(\w+)\s+(.+?)\s*;").unwrap();
    let mut out = HashMap::new();
    for cap in re.captures_iter(css) {
        let name = normalize_color_name(&cap[1]);
        let value = resolve_value(&cap[2]);
        out.insert(name, value);
    }
    out
}

/// Map to Venner tokens (same mapping as GTK4).
pub fn map_gtk3_to_venner_tokens(colors: &HashMap<String, String>) -> HashMap<String, String> {
    let mapping: &[(&str, &str)] = &[
        ("theme_bg_color", "--venner-bg"),
        ("theme_fg_color", "--venner-fg"),
        ("theme_text_color", "--venner-fg"),
        ("accent_color", "--venner-accent"),
        ("borders", "--venner-border"),
        ("error_color", "--venner-error"),
        ("success_color", "--venner-success"),
        ("warning_color", "--venner-warning"),
        ("insensitive_fg_color", "--venner-disabled-fg"),
        ("theme_selected_bg_color", "--venner-selected-bg"),
        ("theme_selected_fg_color", "--venner-selected-fg"),
        ("theme_base_color", "--venner-base"),
        ("insensitive_bg_color", "--venner-disabled-bg"),
    ];
    let mut out = HashMap::new();
    for (gtk_key, venner_key) in mapping {
        if let Some(v) = colors.get(*gtk_key) {
            out.insert((*venner_key).to_string(), v.clone());
        }
    }
    out
}

/// Full parse: @define-color (with normalization and shade/alpha) -> venner tokens.
pub fn parse_gtk3_css(css: &str) -> HashMap<String, String> {
    let colors = parse_define_colors(css);
    map_gtk3_to_venner_tokens(&colors)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_short_names() {
        assert_eq!(normalize_color_name("fg_color"), "theme_fg_color");
        assert_eq!(normalize_color_name("bg_color"), "theme_bg_color");
        assert_eq!(normalize_color_name("theme_fg_color"), "theme_fg_color");
    }

    fn gtk3_fixture() -> &'static str {
        concat!(
            "@define-color theme_fg_color #eeeeec;\n",
            "@define-color theme_bg_color #353535;\n",
            "@define-color theme_base_color #2d2d2d;\n",
        )
    }

    #[test]
    fn parse_gtk3_mint_has_colors() {
        let css = gtk3_fixture();
        let colors = parse_define_colors(css);
        assert!(colors.contains_key("theme_fg_color"));
        assert!(colors.contains_key("theme_bg_color"));
    }

    #[test]
    fn eval_shade_lighten() {
        let r = eval_shade("#353535", 1.2);
        assert!(r.is_some());
        assert!(r.unwrap().starts_with('#'));
    }

    #[test]
    fn eval_alpha_black() {
        assert_eq!(eval_alpha("black", 0.35).as_deref(), Some("rgba(0, 0, 0, 0.35)"));
    }

    #[test]
    fn parse_gtk3_contained_dark() {
        let css = gtk3_fixture();
        let colors = parse_define_colors(css);
        assert!(colors.contains_key("theme_bg_color"));
        assert!(colors.contains_key("theme_fg_color"));
        assert_eq!(colors.get("theme_bg_color").map(|s| s.as_str()), Some("#353535"));
    }

    #[test]
    fn parse_gtk3_full() {
        let css = gtk3_fixture();
        let tokens = parse_gtk3_css(css);
        assert!(!tokens.is_empty());
        assert!(tokens.contains_key("--venner-bg"));
    }
}
