//! GTK4 CSS parser: @define-color and button style extraction.

use regex::Regex;
use std::collections::HashMap;
use std::path::Path;

/// Parse all @define-color lines from GTK4 CSS.
pub fn parse_define_colors(css: &str) -> HashMap<String, String> {
    let re = Regex::new(r"@define-color\s+(\w+)\s+(.+?)\s*;").unwrap();
    let mut out = HashMap::new();
    for cap in re.captures_iter(css) {
        let name = cap[1].to_string();
        let value = cap[2].trim().to_string();
        out.insert(name, value);
    }
    out
}

/// Map GTK4 @define-color names to Venner CSS variable names (--venner-*).
pub fn map_gtk4_to_venner_tokens(colors: &HashMap<String, String>) -> HashMap<String, String> {
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

/// Extract button-related property from a CSS block (e.g. "color: #eee; border: 1px" -> color, border-color, etc).
fn extract_properties(block: &str) -> HashMap<String, String> {
    let mut out = HashMap::new();
    let re = Regex::new(r"(\w+(?:-\w+)*)\s*:\s*([^;]+);").unwrap();
    for cap in re.captures_iter(block) {
        let prop = cap[1].trim().to_string();
        let value = cap[2].trim().to_string();
        out.insert(prop, value);
    }
    out
}

/// Find a rule that contains selector containing "button" (and optionally state like :hover).
/// Returns the declaration block (content inside { }).
fn find_button_block(css: &str, selector_contains: &str) -> Option<String> {
    let needle = selector_contains.to_lowercase();
    for line in css.lines() {
        let line = line.trim();
        if !line.contains('{') || !line.contains('}') {
            continue;
        }
        let check = line.to_lowercase();
        if !check.contains("button") {
            continue;
        }
        if needle == "button "
            && (check.contains("button:")
                || (!check.contains(", button ") && !check.starts_with("button ")))
        {
            continue;
        }
        if !needle.is_empty() && !check.contains(needle.trim()) {
            continue;
        }
        if let Some(start) = line.find('{') {
            let rest = &line[start + 1..];
            let mut depth = 1i32;
            let mut end = rest.len();
            for (i, c) in rest.char_indices() {
                if c == '{' {
                    depth += 1;
                } else if c == '}' {
                    depth -= 1;
                    if depth == 0 {
                        end = i;
                        break;
                    }
                }
            }
            if depth == 0 {
                return Some(rest[..end].to_string());
            }
        }
    }
    None
}

/// Extract button state styles (base, hover, active, disabled) and map to --venner-btn-*.
pub fn extract_button_styles(css: &str) -> HashMap<String, String> {
    let mut out = HashMap::new();

    let base = find_button_block(css, "button ");
    if let Some(block) = base {
        let props = extract_properties(&block);
        if let Some(v) = props.get("color") {
            out.insert("--venner-btn-fg".to_string(), v.clone());
        }
        if let Some(v) = props.get("border-color") {
            out.insert("--venner-btn-border".to_string(), v.clone());
        }
        if let Some(v) = props.get("background-image") {
            out.insert("--venner-btn-bg".to_string(), v.clone());
        }
        if let Some(v) = props.get("border-radius") {
            out.insert("--venner-btn-radius".to_string(), v.clone());
        }
        if let Some(v) = props.get("box-shadow") {
            out.insert("--venner-btn-shadow".to_string(), v.clone());
        }
    }

    let hover = find_button_block(css, "button:hover");
    if let Some(block) = hover {
        let props = extract_properties(&block);
        if let Some(v) = props.get("background-image") {
            out.insert("--venner-btn-bg-hover".to_string(), v.clone());
        }
    }

    let active = find_button_block(css, "button:active");
    if let Some(block) = active {
        let props = extract_properties(&block);
        if let Some(v) = props.get("background-image") {
            out.insert("--venner-btn-bg-active".to_string(), v.clone());
        }
    }

    let disabled = find_button_block(css, "button:disabled");
    if let Some(block) = disabled {
        let props = extract_properties(&block);
        if let Some(v) = props.get("background-image") {
            out.insert("--venner-btn-bg-disabled".to_string(), v.clone());
        }
        if let Some(v) = props.get("color") {
            out.insert("--venner-btn-fg-disabled".to_string(), v.clone());
        }
    }

    out
}

/// Full parse: @define-color -> venner tokens + button styles. Merged into one HashMap.
pub fn parse_gtk4_css(css: &str) -> HashMap<String, String> {
    let colors = parse_define_colors(css);
    let mut tokens = map_gtk4_to_venner_tokens(&colors);
    let button = extract_button_styles(css);
    for (k, v) in button {
        tokens.insert(k, v);
    }
    tokens
}

/// Load and parse a GTK4 CSS file from path.
pub fn load_and_parse_gtk4(path: &Path) -> Result<HashMap<String, String>, std::io::Error> {
    let css = std::fs::read_to_string(path)?;
    Ok(parse_gtk4_css(&css))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn gtk4_fixture() -> &'static str {
        concat!(
            "@define-color theme_bg_color #353535;\n",
            "@define-color theme_fg_color #eeeeec;\n",
            "@define-color accent_color #3584E4;\n",
            "@define-color borders #1b1b1b;\n",
        )
    }

    #[test]
    fn parse_gtk4_default_dark() {
        let css = gtk4_fixture();
        let colors = parse_define_colors(css);
        assert!(colors.contains_key("theme_bg_color"));
        assert!(colors.contains_key("accent_color"));
        assert_eq!(
            colors.get("theme_bg_color").map(|s| s.as_str()),
            Some("#353535")
        );
        assert_eq!(
            colors.get("accent_color").map(|s| s.as_str()),
            Some("#3584E4")
        );
    }

    #[test]
    fn map_to_venner_tokens() {
        let mut colors = HashMap::new();
        colors.insert("theme_bg_color".to_string(), "#353535".to_string());
        colors.insert("accent_color".to_string(), "#3584E4".to_string());
        let tokens = map_gtk4_to_venner_tokens(&colors);
        assert_eq!(
            tokens.get("--venner-bg").map(|s| s.as_str()),
            Some("#353535")
        );
        assert_eq!(
            tokens.get("--venner-accent").map(|s| s.as_str()),
            Some("#3584E4")
        );
    }

    #[test]
    fn parse_gtk4_full() {
        let css = gtk4_fixture();
        let tokens = parse_gtk4_css(css);
        assert!(!tokens.is_empty());
        assert!(tokens.contains_key("--venner-bg") || tokens.contains_key("--venner-btn-fg"));
    }
}
