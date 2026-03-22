/**
 * KDE Plasma theme: Rust routes `get_*_gtk_*` to kdeglobals when desktop is KDE.
 */
import type { CompiledGtkTheme, ThemeDiagnostics } from "@venner/core";

export interface KdeThemeDiagnostics {
	desktopEnv: string;
	source: "system" | "default" | "project";
	/** On KDE this is the resolved `kdeglobals` path. */
	kdeglobalsPath: string | null;
	colorScheme: string;
	tokensCount: number;
	loadedAt: number;
}

/** Venner CSS tokens from backend (`--venner-*`). */
export async function getKdeThemeTokens(): Promise<Record<string, string>> {
	const { invoke } = await import("@venner/core");
	return invoke<Record<string, string>>("get_gtk_theme");
}

/** Same payload as GTK path; on KDE `resolvedCssPath` points at `kdeglobals`. */
export async function getKdeThemeDiagnostics(): Promise<KdeThemeDiagnostics> {
	const { invoke } = await import("@venner/core");
	const d = await invoke<ThemeDiagnostics>("get_gtk_theme_diagnostics");
	return {
		desktopEnv: d.desktopEnv,
		source: d.source,
		kdeglobalsPath: d.resolvedCssPath,
		colorScheme: d.colorScheme,
		tokensCount: d.tokensCount,
		loadedAt: d.loadedAt,
	};
}

export async function getCompiledKdeTheme(): Promise<CompiledGtkTheme> {
	const { invoke } = await import("@venner/core");
	return invoke<CompiledGtkTheme>("get_compiled_gtk_theme");
}

export async function getCompiledKdeThemeDiagnostics(): Promise<KdeThemeDiagnostics> {
	const { invoke } = await import("@venner/core");
	const d = await invoke<ThemeDiagnostics>("get_compiled_gtk_theme_diagnostics");
	return {
		desktopEnv: d.desktopEnv,
		source: d.source,
		kdeglobalsPath: d.resolvedCssPath,
		colorScheme: d.colorScheme,
		tokensCount: d.tokensCount,
		loadedAt: d.loadedAt,
	};
}
