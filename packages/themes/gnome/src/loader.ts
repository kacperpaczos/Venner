/**
 * Load GNOME/GTK theme tokens from Rust backend (get_gtk_theme command).
 */

export interface GnomeThemeConfig {
  name: string;
  colors: {
    bg: string;
    fg: string;
    accent: string;
    border: string;
    hover: string;
    active: string;
  };
  dimensions: {
    radius: string;
    padding: string;
    minHeight: string;
  };
}

/** Fetch Venner CSS tokens (--venner-*) from Rust. */
export async function getThemeTokens(): Promise<Record<string, string>> {
  const { invoke } = await import("@venner/core");
  return invoke<Record<string, string>>("get_gtk_theme");
}

/** Build legacy config from tokens for compatibility. */
export async function loadGnomeTheme(): Promise<GnomeThemeConfig> {
  const tokens = await getThemeTokens();
  return {
    name: "System",
    colors: {
      bg: tokens["--venner-bg"] ?? "#353535",
      fg: tokens["--venner-fg"] ?? "#eeeeec",
      accent: tokens["--venner-accent"] ?? "#3584e4",
      border: tokens["--venner-border"] ?? "#1b1b1b",
      hover: tokens["--venner-btn-bg-hover"] ?? "#404040",
      active: tokens["--venner-btn-bg-active"] ?? "#2a2a2a",
    },
    dimensions: {
      radius: tokens["--venner-btn-radius"] ?? "6px",
      padding: tokens["--venner-btn-padding"] ?? "6px 12px",
      minHeight: tokens["--venner-btn-min-height"] ?? "36px",
    },
  };
}
