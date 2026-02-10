import { GnomeThemeConfig } from "./loader";

/**
 * Convert GNOME theme to Venner tokens
 */
export function mapGnomeToVenner(config: GnomeThemeConfig): Record<string, string> {
  return {
    "--venner-bg": config.colors.bg,
    "--venner-fg": config.colors.fg,
    "--venner-accent": config.colors.accent,
    "--venner-border": config.colors.border,
    "--venner-btn-bg": config.colors.bg,
    "--venner-btn-bg-hover": config.colors.hover,
    "--venner-btn-bg-active": config.colors.active,
    "--venner-btn-fg": config.colors.fg,
    "--venner-btn-accent": config.colors.accent,
    "--venner-btn-radius": config.dimensions.radius,
    "--venner-btn-padding": config.dimensions.padding,
  };
}
