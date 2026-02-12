import { listen as tauriListen } from "@tauri-apps/api/event";
import type { ThemeDiagnostics } from "../types";

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
	onStateChange: (handler: (state: unknown) => void) =>
		listen<unknown>("state:changed", handler),

	onActionDispatched: (handler: (action: unknown) => void) =>
		listen<unknown>("action:dispatched", handler),

	onThemeChange: (handler: (tokens: Record<string, string>) => void) =>
		listen<Record<string, string>>("theme:changed", handler),

	onThemeDiagnostics: (handler: (diagnostics: ThemeDiagnostics) => void) =>
		listen<ThemeDiagnostics>("theme:diagnostics", handler),
};
