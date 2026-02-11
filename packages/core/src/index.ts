// Venner Core - JavaScript client for Rust store
//
// This package provides:
// - IPC wrappers for Tauri communication
// - VennerStore projection (JS side of Rust store)
// - Type definitions (will be Specta-generated)

export { invoke } from "./api/invoke";
export { listen, events } from "./api/listen";
export { store } from "./store";
export type {
  AppState,
  WindowState,
  WidgetState,
  ThemeTokens,
  Action,
} from "./types";
