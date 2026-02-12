import { invoke } from "./api/invoke";
import { listen } from "./api/listen";

/**
 * VennerStore - JavaScript projection of Rust store
 *
 * This is a thin client that communicates with the Rust store
 * via Tauri IPC. All state mutations go through dispatch().
 */
class VennerStore {
	private state: unknown = null;
	private subscribers = new Set<(state: unknown) => void>();

	async init() {
		// Get initial state from Rust
		this.state = await invoke<unknown>("get_state");

		// Subscribe to state changes
		await listen<unknown>("state:changed", (newState) => {
			this.state = newState;
			this.notify();
		});
	}

	/**
	 * Dispatch an action to the Rust store
	 */
	dispatch(action: unknown) {
		return invoke<void>("dispatch", { action });
	}

	/**
	 * Get current state (local cache)
	 */
	getState(): unknown {
		return this.state;
	}

	/**
	 * Subscribe to state changes
	 */
	subscribe(fn: (state: unknown) => void): () => void {
		this.subscribers.add(fn);
		return () => this.subscribers.delete(fn);
	}

	/**
	 * Inject full state (for debugging/time-travel)
	 */
	inject(state: unknown) {
		return invoke<void>("inject_state", { state });
	}

	private notify() {
		for (const fn of this.subscribers) {
			fn(this.state);
		}
	}
}

// Singleton instance
export const store = new VennerStore();
