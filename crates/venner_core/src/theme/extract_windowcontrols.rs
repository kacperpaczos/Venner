use super::compiled_theme::{IconCarrierTheme, WindowControlsTheme, WindowLayoutTheme};
use super::parser_css_ast::{collect_props_from_selectors, CssRule};

pub fn extract_windowcontrols(rules: &[CssRule]) -> (WindowControlsTheme, WindowLayoutTheme) {
    let mut controls = WindowControlsTheme::default();
    let mut layout = WindowLayoutTheme::default();

    let base = collect_props_from_selectors(
        rules,
        &[&["windowcontrols"]],
        &["border-spacing"],
    );
    controls.spacing = base.get("border-spacing").cloned();
    layout.controls_spacing = controls.spacing.clone();

    let start_margin = collect_props_from_selectors(
        rules,
        &[&["windowcontrols:not(.empty).start:dir(ltr)"], &["windowcontrols:not(.empty).end:dir(rtl)"]],
        &["margin-right"],
    );
    controls.margin_end = start_margin.get("margin-right").cloned();
    layout.controls_margin_end = controls.margin_end.clone();

    let end_margin = collect_props_from_selectors(
        rules,
        &[&["windowcontrols:not(.empty).start:dir(rtl)"], &["windowcontrols:not(.empty).end:dir(ltr)"]],
        &["margin-left"],
    );
    controls.margin_start = end_margin.get("margin-left").cloned();
    layout.controls_margin_start = controls.margin_start.clone();

    let button = collect_props_from_selectors(
        rules,
        &[&["windowcontrols", "button"]],
        &[
            "min-width",
            "min-height",
            "padding",
            "border-color",
            "background-color",
            "border",
            "box-shadow",
            "background-image",
        ],
    );
    controls.button_min_width = button.get("min-width").cloned();
    controls.button_min_height = button.get("min-height").cloned();
    controls.button_padding = button.get("padding").cloned();
    controls.button_border_color = button.get("border-color").cloned();
    controls.button_background_color = button.get("background-color").cloned();
    controls.button_border = button.get("border").cloned();
    controls.button_box_shadow = button.get("box-shadow").cloned();
    controls.button_background_image = button.get("background-image").cloned();

    let hover = collect_props_from_selectors(
        rules,
        &[&["windowcontrols", "button:hover"]],
        &["border-color", "background-color"],
    );
    controls.button_hover_border_color = hover.get("border-color").cloned();
    controls.button_hover_background_color = hover.get("background-color").cloned();

    let active = collect_props_from_selectors(
        rules,
        &[&["windowcontrols", "button:active"], &["windowcontrols", "button:checked"]],
        &["border-color", "background-color"],
    );
    controls.button_active_border_color = active.get("border-color").cloned();
    controls.button_active_background_color = active.get("background-color").cloned();

    let carrier = extract_icon_carrier(rules);
    controls.icon_carrier = carrier;

    let end_last_padding = collect_props_from_selectors(
        rules,
        &[&["headerbar", "windowcontrols.end > button:last-child"]],
        &["padding-right"],
    );
    layout.end_last_button_padding_right = end_last_padding.get("padding-right").cloned();

    (controls, layout)
}

fn extract_icon_carrier(rules: &[CssRule]) -> IconCarrierTheme {
    let mut out = IconCarrierTheme::default();

    let base = collect_props_from_selectors(
        rules,
        &[&["windowcontrols", "button", "> image"]],
        &[
            "min-width",
            "min-height",
            "border-radius",
            "background-color",
            "background-image",
            "box-shadow",
        ],
    );
    out.min_width = base.get("min-width").cloned();
    out.min_height = base.get("min-height").cloned();
    out.border_radius = base.get("border-radius").cloned();
    out.background_color = base.get("background-color").cloned();
    out.background_image = base.get("background-image").cloned();
    out.box_shadow = base.get("box-shadow").cloned();

    let hover = collect_props_from_selectors(
        rules,
        &[&["windowcontrols", "button:hover", "> image"]],
        &["background-color"],
    );
    out.hover_background_color = hover.get("background-color").cloned();

    let active = collect_props_from_selectors(
        rules,
        &[&["windowcontrols", "button:active", "> image"], &["windowcontrols", "button:checked", "> image"]],
        &["background-color"],
    );
    out.active_background_color = active.get("background-color").cloned();

    let disabled = collect_props_from_selectors(
        rules,
        &[&["windowcontrols", "button:disabled", "> image"], &["windowcontrols", "button:backdrop", "> image"]],
        &["background-color"],
    );
    out.disabled_background_color = disabled.get("background-color").cloned();

    out
}
