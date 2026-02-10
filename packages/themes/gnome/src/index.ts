import { loadGnomeTheme } from "./loader";
import { mapGnomeToVenner } from "./tokens";

/**
 * Inject GNOME theme tokens into CSS
 */
export async function injectGnomeTheme(): Promise<void> {
  const config = await loadGnomeTheme();
  const tokens = mapGnomeToVenner(config);
  
  // Create CSS string
  const css = Object.entries(tokens)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n  ");
  
  const styleBlock = `
    :root {
      ${css}
    }
  `;
  
  // TODO: Inject via @venner/core API
  console.log("[GNOME Theme]", config.name);
  console.log(styleBlock);
}

// Auto-register on import
if (typeof window !== "undefined") {
  injectGnomeTheme();
}
