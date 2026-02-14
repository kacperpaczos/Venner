/**
 * Venner Dev Logger — logowanie z frontendu do terminala (stdout)
 *
 * termLog — lekka komenda #[tauri::command] z println!
 * Każdy log w osobnej linii, bez spamu z bibliotek.
 *
 * pluginLog — oficjalny tauri-plugin-log (dostępny gdy potrzebujesz
 * pełnego formatowania timestamp/target w logach).
 */

import { invoke } from "@tauri-apps/api/core";
import type { ThemeDiagnostics } from "@venner/themes-gnome";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

async function toTerminal(level: LogLevel, message: string): Promise<void> {
	return invoke("log_to_terminal", { level, message });
}

export const termLog = {
	trace: (msg: string) => toTerminal("trace", msg),
	debug: (msg: string) => toTerminal("debug", msg),
	info: (msg: string) => toTerminal("info", msg),
	warn: (msg: string) => toTerminal("warn", msg),
	error: (msg: string) => toTerminal("error", msg),
	log: (msg: string) => toTerminal("info", msg),
} as const;

// pluginLog — kompatybilny fallback bez twardej zależności na @tauri-apps/plugin-log
// Używa tej samej sygnatury co termLog.
export const pluginLog = {
	trace: termLog.trace,
	debug: termLog.debug,
	info: termLog.info,
	warn: termLog.warn,
	error: termLog.error,
} as const;

export const themeLog = {
	loaded: async (diagnostics: ThemeDiagnostics) =>
		termLog.info(
			`[theme] source=${diagnostics.source} theme=${diagnostics.gtk_theme} scheme=${diagnostics.color_scheme} path=${diagnostics.resolved_css_path ?? "<none>"} gtk=${diagnostics.resolved_gtk_version} tokens=${diagnostics.tokens_count}`,
		),
	fallback: async (diagnostics: ThemeDiagnostics) => {
		if (!diagnostics.fallback_reason) return;
		await termLog.warn(
			`[theme] fallback source=${diagnostics.source} reason=${diagnostics.fallback_reason}`,
		);
	},
	changed: async (diagnostics: ThemeDiagnostics) =>
		termLog.info(
			`[theme] changed source=${diagnostics.source} path=${diagnostics.resolved_css_path ?? "<none>"} tokens=${diagnostics.tokens_count}`,
		),
};
