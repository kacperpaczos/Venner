use super::compiled_theme::HeaderbarTheme;
use super::parser_css_ast::{collect_props_from_selectors, CssRule};

pub fn extract_headerbar(rules: &[CssRule]) -> HeaderbarTheme {
    let mut out = HeaderbarTheme::default();

    let base = collect_props_from_selectors(
        rules,
        &[&["headerbar"], &[".titlebar:not(headerbar)"]],
        &[
            "min-height",
            "padding",
            "border-color",
            "border-width",
            "border-style",
            "background-color",
            "background-image",
            "background",
            "box-shadow",
            "transition",
        ],
    );
    out.min_height = base.get("min-height").cloned();
    out.padding = base.get("padding").cloned();
    out.border_color = base.get("border-color").cloned();
    out.border_width = base.get("border-width").cloned();
    out.border_style = base.get("border-style").cloned();
    out.background_color = base.get("background-color").cloned();
    out.background_image = base
        .get("background-image")
        .cloned()
        .or_else(|| base.get("background").cloned());
    out.box_shadow = base.get("box-shadow").cloned();
    out.transition = base.get("transition").cloned();

    let title = collect_props_from_selectors(
        rules,
        &[&["headerbar", ".title"], &[".titlebar:not(headerbar)", ".title"]],
        &["padding-left", "padding-right"],
    );
    out.title_padding = title
        .get("padding-left")
        .zip(title.get("padding-right"))
        .map(|(left, right)| format!("0 {} 0 {}", right, left));

    let subtitle = collect_props_from_selectors(
        rules,
        &[&["headerbar", ".subtitle"], &[".titlebar:not(headerbar)", ".subtitle"]],
        &["padding-left", "padding-right", "font-size"],
    );
    out.subtitle_padding = subtitle
        .get("padding-left")
        .zip(subtitle.get("padding-right"))
        .map(|(left, right)| format!("0 {} 0 {}", right, left));
    out.subtitle_font_size = subtitle.get("font-size").cloned();

    out
}
