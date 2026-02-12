import { getThemeTokens, loadGnomeTheme } from "./loader";
import { mapGnomeToVenner } from "./tokens";

const STYLE_ID = "venner-theme-tokens";

/**
 * Inject Venner CSS variables into the document (create or update style#venner-theme-tokens).
 */
export function injectTokens(tokens: Record<string, string>): void {
	const css = Object.entries(tokens)
		.map(([key, value]) => `${key}: ${value};`)
		.join("\n  ");
	const styleBlock = `:root {\n  ${css}\n}`;

	let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement("style");
		el.id = STYLE_ID;
		document.head.appendChild(el);
	}
	el.textContent = styleBlock;
}

/**
 * Load theme from backend and inject into DOM. Also subscribes to theme:changed for live updates.
 */
export async function injectGnomeTheme(): Promise<void> {
	try {
		const tokens = await getThemeTokens();
		injectTokens(tokens);
	} catch (e) {
		console.warn("[Venner] get_gtk_theme failed, using fallback", e);
		const config = await loadGnomeTheme();
		injectTokens(mapGnomeToVenner(config));
	}

	if (typeof window !== "undefined") {
		const { listen } = await import("@venner/core");
		listen<Record<string, string>>("theme:changed", (payload) =>
			injectTokens(payload),
		);
	}
}
