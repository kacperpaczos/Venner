import { invoke, store as coreStoreApi } from "./api/invoke";
import { listen } from "./api/listen";
import type {
	AboutDialogResult,
	AppState,
	ImportResult,
	NativeDialogResult,
	ValidationReport,
} from "./types";

/**
 * VennerStore - JavaScript projection of Rust store
 */
class VennerStore {
	private state: AppState | null = null;
	private subscribers = new Set<(state: AppState) => void>();

	async init() {
		this.state = await coreStoreApi.getState();

		await listen<AppState>("state:changed", (newState) => {
			this.state = newState;
			this.notify();
		});
	}

	dispatch(action: unknown) {
		return invoke<void>("dispatch", { action });
	}

	getState(): AppState | null {
		return this.state;
	}

	selectWidgetState(widgetId: string) {
		return this.state?.widgets?.[widgetId] ?? null;
	}

	subscribe(fn: (state: AppState) => void): () => void {
		this.subscribers.add(fn);
		if (this.state) fn(this.state);
		return () => this.subscribers.delete(fn);
	}

	inject(state: AppState) {
		return coreStoreApi.injectState(state);
	}

	exportSnapshot(): Promise<string> {
		return coreStoreApi.exportState();
	}

	validateSnapshot(json: string): Promise<ValidationReport> {
		return coreStoreApi.validateState(json);
	}

	importSnapshot(json: string): Promise<ImportResult> {
		return coreStoreApi.importState(json);
	}

	openFileDialog(): Promise<NativeDialogResult> {
		return coreStoreApi.openFileDialog();
	}

	openColorDialog(): Promise<NativeDialogResult> {
		return coreStoreApi.openColorDialog();
	}

	openFontDialog(): Promise<NativeDialogResult> {
		return coreStoreApi.openFontDialog();
	}

	showAboutDialog(): Promise<AboutDialogResult> {
		return coreStoreApi.showAboutDialog();
	}

	private notify() {
		if (!this.state) return;
		for (const fn of this.subscribers) {
			fn(this.state);
		}
	}
}

export const store = new VennerStore();
