import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import type {
	AppState,
	ImportResult,
	ThemeDiagnostics,
	ValidationReport,
} from "../types";

/**
 * Invoke a Tauri command with type-safe arguments
 */
export async function invoke<T>(
	cmd: string,
	args?: Record<string, unknown>,
): Promise<T> {
	return tauriInvoke<T>(cmd, args);
}

/**
 * Predefined commands for Venner Store
 */
export const store = {
	dispatch: (action: unknown) => invoke<void>("dispatch", { action }),
	getState: () => invoke<AppState>("get_state"),
	injectState: (state: AppState) => invoke<void>("inject_state", { state }),
	getSchemaVersion: () => invoke<number>("get_schema_version"),
	exportState: () => invoke<string>("export_state"),
	validateState: (json: string) =>
		invoke<ValidationReport>("validate_state", { json }),
	importState: (json: string) => invoke<ImportResult>("import_state", { json }),
	getGtkTheme: () => invoke<Record<string, string>>("get_gtk_theme"),
	getGtkThemeDiagnostics: () =>
		invoke<ThemeDiagnostics>("get_gtk_theme_diagnostics"),
};
