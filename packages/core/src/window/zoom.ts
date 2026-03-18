import { invoke } from "../api/invoke";

const DEFAULT_MIN_ZOOM = 0.5;
const DEFAULT_MAX_ZOOM = 3;

export const ZOOM_STEPS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export interface WindowZoomControllerOptions {
	windowId: string;
	minZoom?: number;
	maxZoom?: number;
	initialZoom?: number;
	zoomDelta?: number;
	onZoomChanged?: (zoom: number) => void;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function normalizeZoom(value: number): number {
	return Number(value.toFixed(3));
}

export class WindowZoomController {
	private zoom: number;
	private readonly minZoom: number;
	private readonly maxZoom: number;
	private readonly zoomDelta: number;
	private readonly windowId: string;
	private readonly onZoomChanged?: (zoom: number) => void;
	private gestureBaseZoom: number | null = null;

	constructor(options: WindowZoomControllerOptions) {
		this.windowId = options.windowId;
		this.minZoom = options.minZoom ?? DEFAULT_MIN_ZOOM;
		this.maxZoom = options.maxZoom ?? DEFAULT_MAX_ZOOM;
		this.zoomDelta = options.zoomDelta ?? 0.1;
		this.zoom = clamp(options.initialZoom ?? 1, this.minZoom, this.maxZoom);
		this.onZoomChanged = options.onZoomChanged;
	}

	getZoom(): number {
		return this.zoom;
	}

	async setZoom(nextZoom: number): Promise<number> {
		const normalized = normalizeZoom(clamp(nextZoom, this.minZoom, this.maxZoom));
		if (normalized === this.zoom) return this.zoom;
		this.zoom = normalized;
		await this.dispatchViewportZoom(normalized);
		this.onZoomChanged?.(normalized);
		return normalized;
	}

	async zoomIn(): Promise<number> {
		const current = this.zoom;
		const nextStep = ZOOM_STEPS.find((step) => step > current);
		return this.setZoom(nextStep ?? current + this.zoomDelta);
	}

	async zoomOut(): Promise<number> {
		const current = this.zoom;
		const prevSteps = ZOOM_STEPS.filter((step) => step < current);
		const previousStep = prevSteps.at(-1);
		return this.setZoom(previousStep ?? current - this.zoomDelta);
	}

	resetZoom(): Promise<number> {
		return this.setZoom(1);
	}

	async onWheel(event: WheelEvent): Promise<void> {
		if (!event.ctrlKey && !event.metaKey) return;
		event.preventDefault();
		if (event.deltaY > 0) {
			await this.zoomOut();
			return;
		}
		if (event.deltaY < 0) {
			await this.zoomIn();
		}
	}

	onGestureStart = (): void => {
		this.gestureBaseZoom = this.zoom;
	};

	async onGestureChange(scale: number): Promise<void> {
		if (!Number.isFinite(scale) || scale <= 0) return;
		const base = this.gestureBaseZoom ?? this.zoom;
		await this.setZoom(base * scale);
	}

	onGestureEnd = (): void => {
		this.gestureBaseZoom = null;
	};

	async onKeyDown(event: KeyboardEvent): Promise<void> {
		if (!event.ctrlKey && !event.metaKey) return;
		if (event.key === "+" || event.key === "=") {
			event.preventDefault();
			await this.zoomIn();
			return;
		}
		if (event.key === "-" || event.key === "_") {
			event.preventDefault();
			await this.zoomOut();
			return;
		}
		if (event.key === "0") {
			event.preventDefault();
			await this.resetZoom();
		}
	}

	attach(target: EventTarget = window): () => void {
		const wheelHandler = (event: Event) => {
			void this.onWheel(event as WheelEvent);
		};
		const keydownHandler = (event: Event) => {
			void this.onKeyDown(event as KeyboardEvent);
		};
		const gestureStartHandler = () => this.onGestureStart();
		const gestureChangeHandler = (event: Event) => {
			const scale = (event as Event & { scale?: number }).scale;
			if (typeof scale === "number") {
				void this.onGestureChange(scale);
			}
		};
		const gestureEndHandler = () => this.onGestureEnd();

		target.addEventListener("wheel", wheelHandler, { passive: false });
		target.addEventListener("keydown", keydownHandler);
		target.addEventListener("gesturestart", gestureStartHandler as EventListener);
		target.addEventListener("gesturechange", gestureChangeHandler as EventListener);
		target.addEventListener("gestureend", gestureEndHandler as EventListener);

		return () => {
			target.removeEventListener("wheel", wheelHandler);
			target.removeEventListener("keydown", keydownHandler);
			target.removeEventListener("gesturestart", gestureStartHandler as EventListener);
			target.removeEventListener("gesturechange", gestureChangeHandler as EventListener);
			target.removeEventListener("gestureend", gestureEndHandler as EventListener);
		};
	}

	private dispatchViewportZoom(zoom: number): Promise<void> {
		return invoke<void>("dispatch", {
			action: {
				type: "WindowViewport",
				window_id: this.windowId,
				zoom,
				density: null,
				breakpoint: null,
			},
		});
	}
}

export function createWindowZoomController(
	options: WindowZoomControllerOptions,
): WindowZoomController {
	return new WindowZoomController(options);
}

