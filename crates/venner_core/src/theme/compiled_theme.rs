use super::monitor::ThemeDiagnostics;
use super::resolver::ThemeGtkVersion;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::hash::{DefaultHasher, Hash, Hasher};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompiledGtkTheme {
    pub tokens: HashMap<String, String>,
    pub window: WindowTheme,
    pub widgets: WidgetsTheme,
    pub meta: CompiledGtkThemeMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WindowTheme {
    pub headerbar: HeaderbarTheme,
    pub windowcontrols: WindowControlsTheme,
    pub title_buttons: TitleButtonsTheme,
    pub backdrop: BackdropTheme,
    pub layout: WindowLayoutTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HeaderbarTheme {
    pub min_height: Option<String>,
    pub padding: Option<String>,
    pub border_color: Option<String>,
    pub border_width: Option<String>,
    pub border_style: Option<String>,
    pub background_color: Option<String>,
    pub background_image: Option<String>,
    pub box_shadow: Option<String>,
    pub transition: Option<String>,
    pub title_padding: Option<String>,
    pub subtitle_padding: Option<String>,
    pub subtitle_font_size: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct IconCarrierTheme {
    pub min_width: Option<String>,
    pub min_height: Option<String>,
    pub border_radius: Option<String>,
    pub background_color: Option<String>,
    pub background_image: Option<String>,
    pub box_shadow: Option<String>,
    pub hover_background_color: Option<String>,
    pub active_background_color: Option<String>,
    pub disabled_background_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WindowControlsTheme {
    pub spacing: Option<String>,
    pub margin_start: Option<String>,
    pub margin_end: Option<String>,
    pub button_min_width: Option<String>,
    pub button_min_height: Option<String>,
    pub button_padding: Option<String>,
    pub button_border_color: Option<String>,
    pub button_background_color: Option<String>,
    pub button_hover_border_color: Option<String>,
    pub button_hover_background_color: Option<String>,
    pub button_active_border_color: Option<String>,
    pub button_active_background_color: Option<String>,
    pub button_border: Option<String>,
    pub button_box_shadow: Option<String>,
    pub button_background_image: Option<String>,
    pub icon_carrier: IconCarrierTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TitleButtonIconTheme {
    pub symbolic_name: Option<String>,
    pub resolved_source: Option<String>,
    pub resolved_css_mask: Option<String>,
    pub resolved_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TitleButtonTheme {
    pub color: Option<String>,
    pub hover_color: Option<String>,
    pub active_color: Option<String>,
    pub background_image: Option<String>,
    pub hover_background_image: Option<String>,
    pub active_background_image: Option<String>,
    pub icon: TitleButtonIconTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TitleButtonsTheme {
    pub close: TitleButtonTheme,
    pub maximize: TitleButtonTheme,
    pub minimize: TitleButtonTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WindowLayoutTheme {
    pub controls_spacing: Option<String>,
    pub controls_margin_start: Option<String>,
    pub controls_margin_end: Option<String>,
    pub end_last_button_padding_right: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BackdropTheme {
    pub headerbar_color: Option<String>,
    pub close_background_image: Option<String>,
    pub maximize_color: Option<String>,
    pub minimize_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WidgetsTheme {
    pub button: ButtonTheme,
    pub entry: EntryTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ButtonTheme {
    pub min_height: Option<String>,
    pub min_width: Option<String>,
    pub padding: Option<String>,
    pub border_radius: Option<String>,
    pub border_color: Option<String>,
    pub background_color: Option<String>,
    pub color: Option<String>,
    pub hover_border_color: Option<String>,
    pub hover_background_color: Option<String>,
    pub active_border_color: Option<String>,
    pub active_background_color: Option<String>,
    pub disabled_color: Option<String>,
    pub disabled_border_color: Option<String>,
    pub disabled_background_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EntryTheme {
    pub min_height: Option<String>,
    pub padding: Option<String>,
    pub border_radius: Option<String>,
    pub border_color: Option<String>,
    pub background_color: Option<String>,
    pub color: Option<String>,
    pub focus_border_color: Option<String>,
    pub disabled_color: Option<String>,
    pub disabled_background_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompiledGtkThemeMeta {
    pub gtk_version: String,
    pub source_path: Option<String>,
    pub theme_name: String,
    pub color_scheme: String,
    pub hash: String,
    pub contract_version: String,
}

pub fn make_theme_hash(input: &str) -> String {
    let mut hasher = DefaultHasher::new();
    input.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

pub fn build_meta(
    diagnostics: &ThemeDiagnostics,
    version: ThemeGtkVersion,
    hash_input: &str,
) -> CompiledGtkThemeMeta {
    CompiledGtkThemeMeta {
        gtk_version: if version == ThemeGtkVersion::Unknown {
            diagnostics.resolved_gtk_version.clone()
        } else {
            version.to_string()
        },
        source_path: diagnostics.resolved_css_path.clone(),
        theme_name: diagnostics.gtk_theme.clone(),
        color_scheme: diagnostics.color_scheme.clone(),
        hash: make_theme_hash(hash_input),
        contract_version: "2.1".to_string(),
    }
}
