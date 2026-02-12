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
