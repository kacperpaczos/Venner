import { createWindowZoomController, store, type AppState } from "@venner/core";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";

interface UseWindowZoomOptions {
	windowId: string;
	target?: () => EventTarget | undefined;
}

export function useWindowZoom(options: UseWindowZoomOptions) {
	const [zoom, setZoom] = createSignal(1);
	const controller = createWindowZoomController({
		windowId: options.windowId,
		initialZoom: 1,
		onZoomChanged: setZoom,
	});

	const syncFromState = (state: AppState | null) => {
		const nextZoom = state?.windows?.[options.windowId]?.viewport?.zoom;
		if (typeof nextZoom === "number" && Number.isFinite(nextZoom)) {
			setZoom(nextZoom);
		}
	};

	onMount(() => {
		syncFromState(store.getState());
		const unsubscribe = store.subscribe((state) => syncFromState(state));
		const unbind = controller.attach(options.target?.() ?? window);

		onCleanup(() => {
			unsubscribe();
			unbind();
		});
	});

	const contentStyle = createMemo(() => {
		const level = zoom();
		return {
			transform: `scale(${level})`,
			"transform-origin": "0 0",
			width: `${100 / level}%`,
			height: `${100 / level}%`,
		} as const;
	});

	return {
		zoom,
		contentStyle,
		zoomIn: () => controller.zoomIn(),
		zoomOut: () => controller.zoomOut(),
		resetZoom: () => controller.resetZoom(),
		setZoom: (value: number) => controller.setZoom(value),
	};
}

