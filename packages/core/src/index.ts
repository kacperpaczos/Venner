// Venner Core - JavaScript client for Rust store
//
// This package provides:
// - IPC wrappers for Tauri communication
// - VennerStore projection (JS side of Rust store)
// - Type definitions (will be Specta-generated)

export { invoke } from "./api/invoke";
export { events, listen } from "./api/listen";
export { store } from "./store";
export type {
	Action,
	AppState,
	ImportResult,
	PersistedAppState,
	SessionState,
	ThemeDiagnostics,
	ThemeSource,
	ThemeTokens,
	UiState,
	ValidationReport,
	WidgetState,
	WindowState,
} from "./types";
