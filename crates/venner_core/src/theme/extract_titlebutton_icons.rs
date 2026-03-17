use super::compiled_theme::{TitleButtonIconTheme, TitleButtonTheme, TitleButtonsTheme};
use super::parser_css_ast::{collect_props_from_selectors, first_prop_from_selectors, CssRule};
use std::path::PathBuf;

pub fn extract_titlebuttons(rules: &[CssRule]) -> TitleButtonsTheme {
    let mut out = TitleButtonsTheme::default();

    out.close = extract_button_theme(rules, "close", "window-close-symbolic");
    out.maximize = extract_button_theme(rules, "maximize", "window-maximize-symbolic");
    out.minimize = extract_button_theme(rules, "minimize", "window-minimize-symbolic");

    out
}

fn extract_button_theme(rules: &[CssRule], role: &str, symbolic_name: &str) -> TitleButtonTheme {
    let selector_base = format!("windowcontrols button.{}", role);
    let selector_hover = format!("windowcontrols button.{}:hover", role);
    let selector_active = format!("windowcontrols button.{}:active", role);

    let mut out = TitleButtonTheme::default();

    let base = collect_props_from_selectors(
        rules,
        &[&[selector_base.as_str()]],
        &["color", "background-image", "-gtk-icon-source"],
    );
    out.color = base.get("color").cloned();
    out.background_image = base.get("background-image").cloned();

    let hover = collect_props_from_selectors(
        rules,
        &[&[selector_hover.as_str()]],
        &["color", "background-image", "-gtk-icon-source"],
    );
    out.hover_color = hover.get("color").cloned();
    out.hover_background_image = hover.get("background-image").cloned();

    let active = collect_props_from_selectors(
        rules,
        &[&[selector_active.as_str()]],
        &["color", "background-image", "-gtk-icon-source"],
    );
    out.active_color = active.get("color").cloned();
    out.active_background_image = active.get("background-image").cloned();

    let icon_source = base
        .get("-gtk-icon-source")
        .cloned()
        .or_else(|| hover.get("-gtk-icon-source").cloned())
        .or_else(|| active.get("-gtk-icon-source").cloned())
        .or_else(|| {
            first_prop_from_selectors(
                rules,
                &[&[selector_base.as_str(), "> image.icon"]],
                "-gtk-icon-source",
            )
        });

    out.icon = resolve_icon(symbolic_name, icon_source.as_deref(), out.background_image.as_deref());

    out
}

fn resolve_icon(
    symbolic_name: &str,
    gtk_icon_source: Option<&str>,
    css_background_image: Option<&str>,
) -> TitleButtonIconTheme {
    let mut out = TitleButtonIconTheme {
        symbolic_name: Some(symbolic_name.to_string()),
        resolved_source: Some("fallback-svg".to_string()),
        resolved_css_mask: None,
        resolved_url: None,
    };

    let parsed_symbolic = gtk_icon_source.and_then(parse_gtk_icontheme_name);
    let preferred = parsed_symbolic.unwrap_or(symbolic_name).to_string();
    out.symbolic_name = Some(preferred.clone());

    if let Some(path) = resolve_system_symbolic_icon(&preferred) {
        out.resolved_source = Some("system-icon".to_string());
        out.resolved_url = Some(format!("file://{}", path.display()));
        out.resolved_css_mask = Some(format!("url('file://{}')", path.display()));
        return out;
    }

    if let Some(bg) = css_background_image.filter(|value| {
        let trimmed = value.trim();
        !trimmed.is_empty() && trimmed != "none" && trimmed != "initial" && trimmed != "unset"
    }) {
        out.resolved_source = Some("css-image".to_string());
        out.resolved_css_mask = Some(bg.to_string());
        return out;
    }

    out
}

fn parse_gtk_icontheme_name(source: &str) -> Option<&str> {
    let marker = "-gtk-icontheme(";
    let start = source.find(marker)? + marker.len();
    let raw = source[start..].trim();
    let quote = raw.chars().next()?;
    if quote != '"' && quote != '\'' {
        return None;
    }
    let rest = &raw[1..];
    let end = rest.find(quote)?;
    Some(&rest[..end])
}

fn resolve_system_symbolic_icon(name: &str) -> Option<PathBuf> {
    let candidates = [
        format!("{}.svg", name),
        format!("{}-symbolic.svg", name.trim_end_matches("-symbolic")),
    ];
    let search_dirs = [
        "/usr/share/icons/hicolor/scalable/actions",
        "/usr/share/icons/Adwaita/scalable/actions",
        "/usr/share/icons/Adwaita/symbolic/actions",
        "/usr/share/icons/Yaru/scalable/actions",
        "/usr/share/pixmaps",
    ];

    for dir in search_dirs {
        for file in &candidates {
            let candidate = PathBuf::from(dir).join(file);
            if candidate.exists() {
                return Some(candidate);
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::parse_gtk_icontheme_name;

    #[test]
    fn parses_gtk_icontheme_reference() {
        let src = "-gtk-icontheme(\"window-close-symbolic\")";
        assert_eq!(parse_gtk_icontheme_name(src), Some("window-close-symbolic"));
    }
}
