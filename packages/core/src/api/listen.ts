import { listen as tauriListen } from "@tauri-apps/api/event";
import type { AppState, CompiledGtkTheme, ThemeDiagnostics } from "../types";

/**
 * Listen to Tauri events with type-safe payload
 */
export function listen<T>(
	event: string,
	handler: (payload: T) => void,
): Promise<() => void> {
	return tauriListen<T>(event, (event) => {
		handler(event.payload);
	});
}

/**
 * Predefined event listeners for Venner Store
 */
export const events = {
	onStateChange: (handler: (state: AppState) => void) =>
		listen<AppState>("state:changed", handler),

	onActionDispatched: (handler: (action: unknown) => void) =>
		listen<unknown>("action:dispatched", handler),

	onThemeChange: (handler: (tokens: Record<string, string>) => void) =>
		listen<Record<string, string>>("theme:changed", handler),

	onCompiledThemeChange: (handler: (theme: CompiledGtkTheme) => void) =>
		listen<CompiledGtkTheme>("theme:compiled-changed", handler),

	onThemeDiagnostics: (handler: (diagnostics: ThemeDiagnostics) => void) =>
		listen<ThemeDiagnostics>("theme:diagnostics", handler),

	onRehydrateStarted: (handler: (payload: Record<string, unknown>) => void) =>
		listen<Record<string, unknown>>("rehydrate:started", handler),

	onRehydrateCompleted: (handler: (state: AppState) => void) =>
		listen<AppState>("rehydrate:completed", handler),
};
