import { store } from "@venner/core";
import { createEffect, createSignal } from "solid-js";

/**
 * Hook to subscribe to Venner Store state
 */
export function useStore<T>(selector: (state: unknown) => T): () => T {
	const [value, setValue] = createSignal<T>(selector(store.getState()));

	createEffect(() => {
		const unsubscribe = store.subscribe((newState) => {
			setValue(() => selector(newState));
		});

		return unsubscribe;
	});

	return value;
}

/**
 * Hook to dispatch actions to Venner Store
 */
export function useDispatch() {
	return store.dispatch.bind(store);
}
