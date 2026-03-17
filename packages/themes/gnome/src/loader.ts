/**
 * Load GNOME/GTK theme tokens from Rust backend (get_gtk_theme command).
 */
import type { CompiledGtkTheme } from "@venner/core";

export interface ThemeDiagnostics {
	desktopEnv: string;
	schema: string;
	gtkTheme: string;
	colorScheme: string;
	source: "system" | "project" | "default";
	resolvedCssPath: string | null;
	resolvedGtkVersion: string;
	fallbackReason: string | null;
	tokensCount: number;
	loadedAt: number;
	coverage: {
		window: {
			headerbar: number;
			windowcontrols: number;
			titleButtons: number;
		};
	};
	missingSelectors: string[];
	missingProps: string[];
}

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

/** Fetch diagnostics for the theme loading pipeline. */
export async function getThemeDiagnostics(): Promise<ThemeDiagnostics> {
	const { invoke } = await import("@venner/core");
	return invoke<ThemeDiagnostics>("get_gtk_theme_diagnostics");
}

/** Fetch compiled GTK theme contract (tokens + window + widgets). */
export async function getCompiledTheme(): Promise<CompiledGtkTheme> {
	const { invoke } = await import("@venner/core");
	return invoke<CompiledGtkTheme>("get_compiled_gtk_theme");
}

/** Fetch diagnostics for compiled GTK theme contract. */
export async function getCompiledThemeDiagnostics(): Promise<ThemeDiagnostics> {
	const { invoke } = await import("@venner/core");
	return invoke<ThemeDiagnostics>("get_compiled_gtk_theme_diagnostics");
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
