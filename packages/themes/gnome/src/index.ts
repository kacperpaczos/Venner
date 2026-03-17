import { getCompiledTheme, loadGnomeTheme } from "./loader";
import { mapGnomeToVenner } from "./tokens";
import type { CompiledGtkTheme } from "@venner/core";

const STYLE_ID = "venner-theme-tokens";
const COMPILED_STYLE_ID = "venner-theme-compiled";

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

function cssRule(selector: string, declarations: Record<string, string | undefined>): string {
	const body = Object.entries(declarations)
		.filter(([, value]) => value && value.trim().length > 0)
		.map(([key, value]) => `${key}: ${value};`)
		.join("\n  ");
	if (!body) return "";
	return `${selector} {\n  ${body}\n}\n`;
}

function buttonRoleRules(
	role: "close" | "maximize" | "minimize",
	theme: CompiledGtkTheme["window"]["titleButtons"]["close"],
): string[] {
	const maskImage = theme.icon.resolvedSource === "system-icon" ? theme.icon.resolvedCssMask : undefined;
	return [
		cssRule(`.venner-window-btn[data-role="${role}"]`, {
			color: theme.color,
			"background-image": theme.backgroundImage,
		}),
		cssRule(`.venner-window-btn[data-role="${role}"]:hover:not(:disabled)`, {
			color: theme.hoverColor,
			"background-image": theme.hoverBackgroundImage,
		}),
		cssRule(`.venner-window-btn[data-role="${role}"]:active:not(:disabled)`, {
			color: theme.activeColor,
			"background-image": theme.activeBackgroundImage,
		}),
		cssRule(`.venner-window-btn[data-role="${role}"] .venner-window-btn__icon`, {
			"mask-image": maskImage,
			"-webkit-mask-image": maskImage,
		}),
		cssRule(`.venner-window-btn[data-role="${role}"]`, {
			"--venner-window-icon-source": theme.icon.resolvedSource,
		}),
	];
}

export function injectCompiledTheme(theme: CompiledGtkTheme): void {
	injectTokens(theme.tokens);

	const windowTheme = theme.window;
	const widgets = theme.widgets;
	const sections = [
		cssRule(".venner-window-chrome", {
			"min-height": windowTheme.headerbar.minHeight,
			padding: windowTheme.headerbar.padding,
			"border-width": windowTheme.headerbar.borderWidth,
			"border-style": windowTheme.headerbar.borderStyle,
			"border-color": windowTheme.headerbar.borderColor,
			"background-color": windowTheme.headerbar.backgroundColor,
			"background-image": windowTheme.headerbar.backgroundImage,
			"box-shadow": windowTheme.headerbar.boxShadow,
			transition: windowTheme.headerbar.transition,
		}),
		cssRule(".venner-window-title-wrap strong", {
			padding: windowTheme.headerbar.titlePadding,
		}),
		cssRule(".venner-window-title-wrap small", {
			padding: windowTheme.headerbar.subtitlePadding,
			"font-size": windowTheme.headerbar.subtitleFontSize,
		}),
		cssRule(".venner-window-controls", {
			gap: windowTheme.layout.controlsSpacing ?? windowTheme.windowcontrols.spacing,
			"margin-left": windowTheme.layout.controlsMarginStart ?? windowTheme.windowcontrols.marginStart,
			"margin-right": windowTheme.layout.controlsMarginEnd ?? windowTheme.windowcontrols.marginEnd,
		}),
		cssRule(".venner-window-btn.icon", {
			padding: windowTheme.windowcontrols.buttonPadding,
			border: windowTheme.windowcontrols.buttonBorder,
			"border-color": windowTheme.windowcontrols.buttonBorderColor,
			"background-color": windowTheme.windowcontrols.buttonBackgroundColor,
			"background-image": windowTheme.windowcontrols.buttonBackgroundImage,
			"box-shadow": windowTheme.windowcontrols.buttonBoxShadow,
			"min-width": windowTheme.windowcontrols.buttonMinWidth,
			"min-height": windowTheme.windowcontrols.buttonMinHeight,
		}),
		cssRule(".venner-window-btn__icon-carrier", {
			"min-width": windowTheme.windowcontrols.iconCarrier.minWidth,
			"min-height": windowTheme.windowcontrols.iconCarrier.minHeight,
			"border-radius": windowTheme.windowcontrols.iconCarrier.borderRadius,
			"background-color": windowTheme.windowcontrols.iconCarrier.backgroundColor,
			"background-image": windowTheme.windowcontrols.iconCarrier.backgroundImage,
			"box-shadow": windowTheme.windowcontrols.iconCarrier.boxShadow,
		}),
		cssRule(".venner-window-btn.icon:hover:not(:disabled) .venner-window-btn__icon-carrier", {
			"background-color": windowTheme.windowcontrols.iconCarrier.hoverBackgroundColor,
		}),
		cssRule(".venner-window-btn.icon:active:not(:disabled) .venner-window-btn__icon-carrier", {
			"background-color": windowTheme.windowcontrols.iconCarrier.activeBackgroundColor,
		}),
		cssRule(".venner-window-btn.icon:disabled .venner-window-btn__icon-carrier", {
			"background-color": windowTheme.windowcontrols.iconCarrier.disabledBackgroundColor,
		}),
		cssRule(".venner-window-btn.icon:hover:not(:disabled)", {
			"border-color": windowTheme.windowcontrols.buttonHoverBorderColor,
			"background-color": windowTheme.windowcontrols.buttonHoverBackgroundColor,
		}),
		cssRule(".venner-window-btn.icon:active:not(:disabled)", {
			"border-color": windowTheme.windowcontrols.buttonActiveBorderColor,
			"background-color": windowTheme.windowcontrols.buttonActiveBackgroundColor,
		}),
		...buttonRoleRules("close", windowTheme.titleButtons.close),
		...buttonRoleRules("maximize", windowTheme.titleButtons.maximize),
		...buttonRoleRules("minimize", windowTheme.titleButtons.minimize),
		cssRule(".venner-window-chrome[data-focused=\"false\"]", {
			color: windowTheme.backdrop.headerbarColor,
		}),
		cssRule(".venner-button", {
			"min-height": widgets.button.minHeight,
			"min-width": widgets.button.minWidth,
			padding: widgets.button.padding,
			"border-radius": widgets.button.borderRadius,
			"border-color": widgets.button.borderColor,
			"background-color": widgets.button.backgroundColor,
			color: widgets.button.color,
		}),
		cssRule('.venner-button[data-hovered="true"]', {
			"border-color": widgets.button.hoverBorderColor,
			"background-color": widgets.button.hoverBackgroundColor,
		}),
		cssRule('.venner-button[data-pressed="true"]', {
			"border-color": widgets.button.activeBorderColor,
			"background-color": widgets.button.activeBackgroundColor,
		}),
		cssRule('.venner-button[data-disabled="true"]', {
			color: widgets.button.disabledColor,
			"border-color": widgets.button.disabledBorderColor,
			"background-color": widgets.button.disabledBackgroundColor,
		}),
		cssRule(".venner-check-button", {
			color: widgets.entry.color ?? widgets.button.color,
		}),
		cssRule(".venner-toggle-button", {
			"min-height": widgets.button.minHeight,
			padding: widgets.button.padding,
			"border-radius": widgets.button.borderRadius,
			"border-color": widgets.button.borderColor,
			"background-color": widgets.button.backgroundColor,
			color: widgets.button.color,
		}),
		cssRule('.venner-toggle-button[data-pressed="true"]', {
			"border-color": widgets.button.activeBorderColor,
			"background-color": widgets.button.activeBackgroundColor,
		}),
		cssRule(".venner-switch", {
			"border-color": widgets.button.borderColor,
			"background-color": widgets.button.backgroundColor,
		}),
		cssRule('.venner-switch[data-checked="true"]', {
			"background-color": widgets.button.activeBackgroundColor,
		}),
		cssRule(".venner-tablist, .venner-tabpanel", {
			"border-color": widgets.button.borderColor,
			"background-color": widgets.entry.backgroundColor,
			color: widgets.entry.color,
		}),
		cssRule('.venner-tab[data-active="true"]', {
			"background-color": widgets.button.activeBackgroundColor,
			color: widgets.button.color,
		}),
		cssRule(".venner-popover", {
			"border-color": widgets.button.borderColor,
			"background-color": widgets.entry.backgroundColor,
			color: widgets.entry.color,
		}),
		cssRule(".venner-list-view, .venner-list-box", {
			"border-color": widgets.button.borderColor,
			"background-color": widgets.entry.backgroundColor,
			color: widgets.entry.color,
		}),
		cssRule(".venner-list-row, .venner-list-box-row", {
			"border-color": widgets.button.borderColor,
			color: widgets.entry.color,
		}),
		cssRule(".venner-entry", {
			"min-height": widgets.entry.minHeight,
			padding: widgets.entry.padding,
			"border-radius": widgets.entry.borderRadius,
			"border-color": widgets.entry.borderColor,
			"background-color": widgets.entry.backgroundColor,
			color: widgets.entry.color,
		}),
		cssRule(".venner-entry:focus-visible", {
			"border-color": widgets.entry.focusBorderColor,
		}),
		cssRule(".venner-entry:disabled", {
			color: widgets.entry.disabledColor,
			"background-color": widgets.entry.disabledBackgroundColor,
		}),
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
 * Load theme from backend and inject into DOM. Also subscribes to theme:changed for live updates.
 */
export async function injectGnomeTheme(): Promise<void> {
	try {
		const compiled = await getCompiledTheme();
		injectCompiledTheme(compiled);
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
		listen<CompiledGtkTheme>("theme:compiled-changed", (payload) =>
			injectCompiledTheme(payload),
		);
	}
}

export {
	getCompiledTheme,
	getCompiledThemeDiagnostics,
	getThemeDiagnostics,
	getThemeTokens,
	type ThemeDiagnostics,
} from "./loader";
