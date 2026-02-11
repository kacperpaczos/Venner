import { invoke as tauriInvoke } from "@tauri-apps/api/core";

/**
 * Invoke a Tauri command with type-safe arguments
 */
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}

/**
 * Predefined commands for Venner Store
 */
export const store = {
  dispatch: (action: unknown) => invoke<void>("dispatch", { action }),
  getState: () => invoke<unknown>("get_state"),
  injectState: (state: unknown) => invoke<void>("inject_state", { state }),
};
