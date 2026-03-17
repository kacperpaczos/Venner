use super::compiled_theme::{ButtonTheme, EntryTheme, WidgetsTheme};
use regex::Regex;

fn capture_block(css: &str, pattern: &str) -> Option<String> {
    let re = Regex::new(pattern).ok()?;
    re.captures(css)
        .and_then(|cap| cap.get(1).map(|m| m.as_str().to_string()))
}

fn capture_prop(block: &str, name: &str) -> Option<String> {
    let pattern = format!(r"(?m)\b{}\s*:\s*([^;]+);", regex::escape(name));
    let re = Regex::new(&pattern).ok()?;
    re.captures(block)
        .and_then(|cap| cap.get(1).map(|m| m.as_str().trim().to_string()))
}

pub fn parse_gtk4_widgets_css(css: &str) -> WidgetsTheme {
    let mut out = WidgetsTheme::default();

    if let Some(button_block) = capture_block(css, r"(?s)\bbutton\s*\{(.*?)\}") {
        out.button = ButtonTheme {
            min_height: capture_prop(&button_block, "min-height"),
            min_width: capture_prop(&button_block, "min-width"),
            padding: capture_prop(&button_block, "padding"),
            border_radius: capture_prop(&button_block, "border-radius"),
            border_color: capture_prop(&button_block, "border-color"),
            background_color: capture_prop(&button_block, "background-color"),
            color: capture_prop(&button_block, "color"),
            ..ButtonTheme::default()
        };
    }
    if let Some(button_hover) = capture_block(css, r"(?s)\bbutton:hover\s*\{(.*?)\}") {
        out.button.hover_border_color = capture_prop(&button_hover, "border-color");
        out.button.hover_background_color = capture_prop(&button_hover, "background-color");
    }
    if let Some(button_active) = capture_block(
        css,
        r"(?s)\bbutton\.keyboard-activating,\s*button:active,\s*button:checked\s*\{(.*?)\}",
    ) {
        out.button.active_border_color = capture_prop(&button_active, "border-color");
        out.button.active_background_color = capture_prop(&button_active, "background-color");
    }
    if let Some(button_disabled) = capture_block(css, r"(?s)\bbutton:disabled\s*\{(.*?)\}") {
        out.button.disabled_color = capture_prop(&button_disabled, "color");
        out.button.disabled_border_color = capture_prop(&button_disabled, "border-color");
        out.button.disabled_background_color = capture_prop(&button_disabled, "background-color");
    }

    if let Some(entry_block) = capture_block(css, r"(?s)\bentry\s*\{(.*?)\}") {
        out.entry = EntryTheme {
            min_height: capture_prop(&entry_block, "min-height"),
            padding: capture_prop(&entry_block, "padding"),
            border_radius: capture_prop(&entry_block, "border-radius"),
            border_color: capture_prop(&entry_block, "border-color"),
            background_color: capture_prop(&entry_block, "background-color"),
            color: capture_prop(&entry_block, "color"),
            ..EntryTheme::default()
        };
    }
    if let Some(entry_focus) =
        capture_block(css, r"(?s)\bentry:focus(?:-within)?\s*\{(.*?)\}")
    {
        out.entry.focus_border_color = capture_prop(&entry_focus, "border-color");
    }
    if let Some(entry_disabled) = capture_block(css, r"(?s)\bentry:disabled\s*\{(.*?)\}") {
        out.entry.disabled_color = capture_prop(&entry_disabled, "color");
        out.entry.disabled_background_color = capture_prop(&entry_disabled, "background-color");
    }

    out
}

#[cfg(test)]
mod tests {
    use super::parse_gtk4_widgets_css;

    #[test]
    fn parses_button_and_entry_contract() {
        let css = r#"
button {
  min-height: 22px;
  min-width: 20px;
  padding: 5px 8px;
  border-radius: 3px;
  border-color: #292929;
  background-color: #454545;
}
button:hover { background-color: #525252; }
button:disabled { color: rgba(255,255,255,0.42); }
entry {
  min-height: 28px;
  padding: 5px 8px;
  border-radius: 3px;
  border-color: #292929;
  background-color: #404040;
}
entry:focus { border-color: #1f9ede; }
"#;
        let parsed = parse_gtk4_widgets_css(css);
        assert_eq!(parsed.button.min_height.as_deref(), Some("22px"));
        assert_eq!(parsed.button.hover_background_color.as_deref(), Some("#525252"));
        assert_eq!(parsed.entry.focus_border_color.as_deref(), Some("#1f9ede"));
    }
}
