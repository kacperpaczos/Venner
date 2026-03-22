import type { CompiledGtkTheme } from "@venner/core";
import {
	getCompiledKdeTheme,
	getKdeThemeTokens,
} from "./loader";

const TOKENS_STYLE_ID = "venner-theme-tokens";
const COMPILED_STYLE_ID = "venner-theme-compiled-kde";

/** Breeze-style title button hover (fallback if tokens lack accent variants). */
const BREEZE_CLOSE_HOVER = "#da4453";
const BREEZE_MAX_HOVER = "#27ae60";
const BREEZE_MIN_HOVER = "#f4d03f";

/**
 * Inject Venner CSS variables (`:root`), same element id as GNOME so only one token block exists.
 */
export function injectKdeTokens(tokens: Record<string, string>): void {
	const css = Object.entries(tokens)
		.map(([key, value]) => `${key}: ${value};`)
		.join("\n  ");
	const styleBlock = `:root {\n  ${css}\n}`;

	let el = document.getElementById(TOKENS_STYLE_ID) as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement("style");
		el.id = TOKENS_STYLE_ID;
		document.head.appendChild(el);
	}
	el.textContent = styleBlock;
}

function cssRule(selector: string, declarations: Record<string, string | undefined>): string {
	const body = Object.entries(declarations)
		.filter(([, value]) => value && value.trim().length > 0)
		.map(([key, value]) => `${key}: ${value};`)
		.join("\n  ");
	if (!body) return "";
	return `${selector} {\n  ${body}\n}\n`;
}

function widgetSections(theme: CompiledGtkTheme): string[] {
	const w = theme.widgets;
	return [
		cssRule(".venner-button", {
			"min-height": w.button.minHeight,
			"min-width": w.button.minWidth,
			padding: w.button.padding,
			"border-radius": w.button.borderRadius,
			"border-color": w.button.borderColor,
			"background-color": w.button.backgroundColor,
			color: w.button.color,
		}),
		cssRule('.venner-button[data-hovered="true"]', {
			"border-color": w.button.hoverBorderColor,
			"background-color": w.button.hoverBackgroundColor,
		}),
		cssRule('.venner-button[data-pressed="true"]', {
			"border-color": w.button.activeBorderColor,
			"background-color": w.button.activeBackgroundColor,
		}),
		cssRule('.venner-button[data-disabled="true"]', {
			color: w.button.disabledColor,
			"border-color": w.button.disabledBorderColor,
			"background-color": w.button.disabledBackgroundColor,
		}),
		cssRule(".venner-check-button", {
			color: w.entry.color ?? w.button.color,
		}),
		cssRule(".venner-toggle-button", {
			"min-height": w.button.minHeight,
			padding: w.button.padding,
			"border-radius": w.button.borderRadius,
			"border-color": w.button.borderColor,
			"background-color": w.button.backgroundColor,
			color: w.button.color,
		}),
		cssRule('.venner-toggle-button[data-pressed="true"]', {
			"border-color": w.button.activeBorderColor,
			"background-color": w.button.activeBackgroundColor,
		}),
		cssRule(".venner-switch", {
			"border-color": w.button.borderColor,
			"background-color": w.button.backgroundColor,
		}),
		cssRule('.venner-switch[data-checked="true"]', {
			"background-color": w.button.activeBackgroundColor,
		}),
		cssRule(".venner-tablist, .venner-tabpanel", {
			"border-color": w.button.borderColor,
			"background-color": w.entry.backgroundColor,
			color: w.entry.color,
		}),
		cssRule('.venner-tab[data-active="true"]', {
			"background-color": w.button.activeBackgroundColor,
			color: w.button.color,
		}),
		cssRule(".venner-popover", {
			"border-color": w.button.borderColor,
			"background-color": w.entry.backgroundColor,
			color: w.entry.color,
		}),
		cssRule(".venner-list-view, .venner-list-box", {
			"border-color": w.button.borderColor,
			"background-color": w.entry.backgroundColor,
			color: w.entry.color,
		}),
		cssRule(".venner-list-row, .venner-list-box-row", {
			"border-color": w.button.borderColor,
			color: w.entry.color,
		}),
		cssRule(".venner-entry", {
			"min-height": w.entry.minHeight,
			padding: w.entry.padding,
			"border-radius": w.entry.borderRadius,
			"border-color": w.entry.borderColor,
			"background-color": w.entry.backgroundColor,
			color: w.entry.color,
		}),
		cssRule(".venner-entry:focus-visible", {
			"border-color": w.entry.focusBorderColor,
		}),
		cssRule(".venner-entry:disabled", {
			color: w.entry.disabledColor,
			"background-color": w.entry.disabledBackgroundColor,
		}),
	];
}

/**
 * KDE-specific compiled rules: headerbar from WM colors, Breeze circular title buttons.
 */
export function injectCompiledKdeTheme(theme: CompiledGtkTheme): void {
	injectKdeTokens(theme.tokens);

	const win = theme.window;
	const hb = win.headerbar;
	const sections = [
		cssRule(".venner-application-window", {
			"background-color": "var(--venner-bg)",
			"border-color": "var(--venner-border)",
			"box-shadow": hb.boxShadow,
		}),
		cssRule(".venner-window-chrome", {
			"min-height": hb.minHeight ?? "46px",
			padding: hb.padding,
			"border-width": hb.borderWidth,
			"border-style": hb.borderStyle ?? "solid",
			"border-color": hb.borderColor ?? "var(--venner-border)",
			"background-color": "var(--venner-headerbar-bg)",
			color: "var(--venner-headerbar-fg)",
			"background-image": hb.backgroundImage,
			"box-shadow": hb.boxShadow,
			transition: hb.transition ?? "background-color 0.15s ease, color 0.15s ease",
		}),
		cssRule(".venner-window-chrome[data-focused=\"false\"]", {
			"background-color": "var(--venner-headerbar-bg-inactive)",
			color: "var(--venner-headerbar-fg-inactive)",
		}),
		cssRule(".venner-window-title-wrap strong", {
			padding: hb.titlePadding,
		}),
		cssRule(".venner-window-title-wrap small", {
			padding: hb.subtitlePadding,
			"font-size": hb.subtitleFontSize,
		}),
		cssRule(".venner-window-controls", {
			gap: win.layout.controlsSpacing ?? win.windowcontrols.spacing ?? "4px",
			"margin-left": win.layout.controlsMarginStart ?? win.windowcontrols.marginStart,
			"margin-right": win.layout.controlsMarginEnd ?? win.windowcontrols.marginEnd,
		}),
		cssRule(".venner-window-btn.icon", {
			"border-radius": "50%",
			"min-width": win.windowcontrols.buttonMinWidth ?? "24px",
			"min-height": win.windowcontrols.buttonMinHeight ?? "24px",
			padding: win.windowcontrols.buttonPadding ?? "0",
			border: win.windowcontrols.buttonBorder ?? "none",
			"border-color": "transparent",
			"background-color": "transparent",
			"background-image": "none",
			"box-shadow": "none",
			color: "var(--venner-headerbar-fg)",
			transition: "background-color 0.12s ease, color 0.12s ease",
		}),
		cssRule('.venner-window-chrome[data-focused="false"] .venner-window-btn.icon', {
			color: "var(--venner-headerbar-fg-inactive)",
		}),
		cssRule('.venner-window-btn[data-role="close"]:hover:not(:disabled)', {
			"background-color": BREEZE_CLOSE_HOVER,
			color: "#ffffff",
		}),
		cssRule('.venner-window-btn[data-role="maximize"]:hover:not(:disabled)', {
			"background-color": BREEZE_MAX_HOVER,
			color: "#ffffff",
		}),
		cssRule('.venner-window-btn[data-role="minimize"]:hover:not(:disabled)', {
			"background-color": BREEZE_MIN_HOVER,
			color: "#2d2d2d",
		}),
		cssRule('.venner-window-chrome[data-focused="false"] .venner-window-btn[data-role="close"]:hover:not(:disabled)', {
			"background-color": BREEZE_CLOSE_HOVER,
			color: "#ffffff",
		}),
		cssRule('.venner-window-chrome[data-focused="false"] .venner-window-btn[data-role="maximize"]:hover:not(:disabled)', {
			"background-color": BREEZE_MAX_HOVER,
			color: "#ffffff",
		}),
		cssRule('.venner-window-chrome[data-focused="false"] .venner-window-btn[data-role="minimize"]:hover:not(:disabled)', {
			"background-color": BREEZE_MIN_HOVER,
			color: "#2d2d2d",
		}),
		cssRule(".venner-window-btn__icon-carrier", {
			"min-width": win.windowcontrols.iconCarrier.minWidth ?? "16px",
			"min-height": win.windowcontrols.iconCarrier.minHeight ?? "16px",
			"border-radius": win.windowcontrols.iconCarrier.borderRadius ?? "50%",
			"background-color": "transparent",
		}),
		cssRule('.venner-window-chrome[data-focused="false"]', {
			color: win.backdrop.headerbarColor ?? "var(--venner-headerbar-fg-inactive)",
		}),
		cssRule('.venner-application-window[data-focused="false"]', {
			color: win.backdrop.headerbarColor,
		}),
		...widgetSections(theme),
	];

	let el = document.getElementById(COMPILED_STYLE_ID) as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement("style");
		el.id = COMPILED_STYLE_ID;
		document.head.appendChild(el);
	}
	el.textContent = sections.filter(Boolean).join("\n");
}

/**
 * Load KDE-backed theme from Tauri and subscribe to `theme:*` events.
 */
export async function injectKdeTheme(): Promise<void> {
	try {
		const compiled = await getCompiledKdeTheme();
		injectCompiledKdeTheme(compiled);
	} catch (e) {
		console.warn("[Venner] get_compiled_gtk_theme failed on KDE, using token fallback", e);
		const tokens = await getKdeThemeTokens();
		injectKdeTokens(tokens);
	}

	if (typeof window !== "undefined") {
		const { listen } = await import("@venner/core");
		await listen<Record<string, string>>("theme:changed", (payload) => injectKdeTokens(payload));
		await listen<CompiledGtkTheme>("theme:compiled-changed", (payload) =>
			injectCompiledKdeTheme(payload),
		);
	}
}

export {
	getCompiledKdeTheme,
	getCompiledKdeThemeDiagnostics,
	getKdeThemeDiagnostics,
	getKdeThemeTokens,
	type KdeThemeDiagnostics,
} from "./loader";

export default {
	name: "kde",
	supported: true,
};
