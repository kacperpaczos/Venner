import { listen as tauriListen, Event } from "@tauri-apps/api/event";

/**
 * Listen to Tauri events with type-safe payload
 */
export function listen<T>(event: string, handler: (payload: T) => void): Promise<() => void> {
  return tauriListen<Event<T>>(event, (event) => {
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
};
