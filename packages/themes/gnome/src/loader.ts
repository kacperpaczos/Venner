/**
 * Load GNOME/GTK theme configuration
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

export async function loadGnomeTheme(): Promise<GnomeThemeConfig> {
  // TODO: Parse ~/.themes/$GTK_THEME/gtk-4.0/gtk.css
  // TODO: Extract @define-color declarations
  // TODO: Query gsettings for accent color
  
  return {
    name: "Adwaita",
    colors: {
      bg: "#353535",
      fg: "#ffffff",
      accent: "#3584e4",
      border: "#444444",
      hover: "#404040",
      active: "#2a2a2a",
    },
    dimensions: {
      radius: "6px",
      padding: "6px 12px",
      minHeight: "36px",
    },
  };
}
