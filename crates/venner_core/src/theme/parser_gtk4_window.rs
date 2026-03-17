use super::compiled_theme::{BackdropTheme, WindowTheme};
use super::extract_titlebutton_icons::extract_titlebuttons;
use super::extract_window_headerbar::extract_headerbar;
use super::extract_windowcontrols::extract_windowcontrols;
use super::parser_css_ast::{first_prop_from_selectors, parse_rules};
use serde::Serialize;

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowParseReport {
    pub headerbar_coverage: f32,
    pub windowcontrols_coverage: f32,
    pub titlebuttons_coverage: f32,
    pub missing_selectors: Vec<String>,
    pub missing_props: Vec<String>,
}

pub fn parse_gtk4_window_css_with_report(css: &str) -> (WindowTheme, WindowParseReport) {
    let rules = parse_rules(css);
    let mut out = WindowTheme::default();

    out.headerbar = extract_headerbar(&rules);
    let (controls, layout) = extract_windowcontrols(&rules);
    out.windowcontrols = controls;
    out.layout = layout;
    out.title_buttons = extract_titlebuttons(&rules);

    out.backdrop = BackdropTheme {
        headerbar_color: first_prop_from_selectors(
            &rules,
            &[&["headerbar:backdrop"], &[".titlebar:backdrop:not(headerbar)"]],
            "color",
        ),
        close_background_image: first_prop_from_selectors(
            &rules,
            &[&["windowcontrols", "button.close:backdrop"]],
            "background-image",
        ),
        maximize_color: first_prop_from_selectors(
            &rules,
            &[&["windowcontrols", "button.maximize:backdrop"]],
            "color",
        ),
        minimize_color: first_prop_from_selectors(
            &rules,
            &[&["windowcontrols", "button.minimize:backdrop"]],
            "color",
        ),
    };

    let report = build_report(&out, &rules);
    (out, report)
}

pub fn parse_gtk4_window_css(css: &str) -> WindowTheme {
    parse_gtk4_window_css_with_report(css).0
}

fn build_report(theme: &WindowTheme, rules: &[super::parser_css_ast::CssRule]) -> WindowParseReport {
    let mut missing_selectors = Vec::new();
    let mut missing_props = Vec::new();

    if !has_selector(rules, &["headerbar"]) && !has_selector(rules, &[".titlebar:not(headerbar)"]) {
        missing_selectors.push("headerbar/.titlebar:not(headerbar)".to_string());
    }
    if !has_selector(rules, &["windowcontrols", "button > image"]) {
        missing_selectors.push("windowcontrols button > image".to_string());
    }

    let header_expected = [
        theme.headerbar.min_height.as_ref(),
        theme.headerbar.padding.as_ref(),
        theme.headerbar.border_color.as_ref(),
        theme.headerbar.background_color.as_ref(),
    ];
    let header_found = header_expected.iter().filter(|v| v.is_some()).count() as f32;
    for (name, val) in [
        ("headerbar.minHeight", theme.headerbar.min_height.as_ref()),
        ("headerbar.padding", theme.headerbar.padding.as_ref()),
        ("headerbar.borderColor", theme.headerbar.border_color.as_ref()),
        ("headerbar.backgroundColor", theme.headerbar.background_color.as_ref()),
    ] {
        if val.is_none() {
            missing_props.push(name.to_string());
        }
    }

    let controls_expected = [
        theme.windowcontrols.spacing.as_ref(),
        theme.windowcontrols.button_min_width.as_ref(),
        theme.windowcontrols.button_padding.as_ref(),
        theme.windowcontrols.icon_carrier.border_radius.as_ref(),
    ];
    let controls_found = controls_expected.iter().filter(|v| v.is_some()).count() as f32;
    for (name, val) in [
        ("windowcontrols.spacing", theme.windowcontrols.spacing.as_ref()),
        (
            "windowcontrols.buttonMinWidth",
            theme.windowcontrols.button_min_width.as_ref(),
        ),
        ("windowcontrols.buttonPadding", theme.windowcontrols.button_padding.as_ref()),
        (
            "windowcontrols.iconCarrier.borderRadius",
            theme.windowcontrols.icon_carrier.border_radius.as_ref(),
        ),
    ] {
        if val.is_none() {
            missing_props.push(name.to_string());
        }
    }

    let title_expected = [
        theme.title_buttons.close.icon.resolved_source.as_ref(),
        theme.title_buttons.maximize.icon.resolved_source.as_ref(),
        theme.title_buttons.minimize.icon.resolved_source.as_ref(),
    ];
    let title_found = title_expected.iter().filter(|v| v.is_some()).count() as f32;
    for (name, val) in [
        (
            "titleButtons.close.icon.resolvedSource",
            theme.title_buttons.close.icon.resolved_source.as_ref(),
        ),
        (
            "titleButtons.maximize.icon.resolvedSource",
            theme.title_buttons.maximize.icon.resolved_source.as_ref(),
        ),
        (
            "titleButtons.minimize.icon.resolvedSource",
            theme.title_buttons.minimize.icon.resolved_source.as_ref(),
        ),
    ] {
        if val.is_none() {
            missing_props.push(name.to_string());
        }
    }

    WindowParseReport {
        headerbar_coverage: header_found / 4.0,
        windowcontrols_coverage: controls_found / 4.0,
        titlebuttons_coverage: title_found / 3.0,
        missing_selectors,
        missing_props,
    }
}

fn has_selector(rules: &[super::parser_css_ast::CssRule], parts: &[&str]) -> bool {
    rules
        .iter()
        .flat_map(|rule| rule.selectors.iter())
        .any(|selector| parts.iter().all(|part| selector.contains(part)))
}

#[cfg(test)]
mod tests {
    use super::parse_gtk4_window_css_with_report;

    #[test]
    fn parses_selector_order_both_variants() {
        let css = r#"
.titlebar:not(headerbar), headerbar {
  min-height: 46px;
  padding: 0 6px;
  border-color: #212121;
  background-color: #2b2b2b;
}
windowcontrols { border-spacing: 6px; }
windowcontrols button { min-width: 34px; padding: 0; border: none; box-shadow: none; }
windowcontrols button > image { border-radius: 9999px; min-height: 30px; min-width: 30px; }
"#;
        let (parsed, report) = parse_gtk4_window_css_with_report(css);
        assert_eq!(parsed.headerbar.min_height.as_deref(), Some("46px"));
        assert_eq!(parsed.windowcontrols.spacing.as_deref(), Some("6px"));
        assert_eq!(
            parsed.windowcontrols.icon_carrier.border_radius.as_deref(),
            Some("9999px")
        );
        assert!(report.headerbar_coverage > 0.5);
    }
}
