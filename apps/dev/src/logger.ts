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

// pluginLog — alternatywa gdy potrzebujesz pełnego formatu (timestamp, target)
import {
	trace as pt,
	debug as pd,
	info as pi,
	warn as pw,
	error as pe,
} from "@tauri-apps/plugin-log";

export const pluginLog = {
	trace: pt,
	debug: pd,
	info: pi,
	warn: pw,
	error: pe,
} as const;
