import type { WindowGraphState } from "./types";

export class WindowGraph {
	private state: WindowGraphState;

	constructor(initial?: Partial<WindowGraphState>) {
		this.state = {
			activeWindowId: initial?.activeWindowId ?? null,
			modalStack: initial?.modalStack ? [...initial.modalStack] : [],
			transientFor: initial?.transientFor ? { ...initial.transientFor } : {},
			focusOwners: initial?.focusOwners ? { ...initial.focusOwners } : {},
		};
	}

	getState(): WindowGraphState {
		return {
			activeWindowId: this.state.activeWindowId,
			modalStack: [...this.state.modalStack],
			transientFor: { ...this.state.transientFor },
			focusOwners: { ...this.state.focusOwners },
		};
	}

	setActiveWindow(windowId: string | null): void {
		this.state.activeWindowId = windowId;
	}

	blockedByModal(windowId: string): boolean {
		const top = this.state.modalStack.at(-1);
		if (!top) return false;
		if (top === windowId) return false;
		return this.resolveTransientRoot(windowId) !== top;
	}

	pushModal(windowId: string): void {
		if (!this.state.modalStack.includes(windowId)) {
			this.state.modalStack.push(windowId);
		}
		this.setActiveWindow(windowId);
	}

	popModal(windowId: string): void {
		this.state.modalStack = this.state.modalStack.filter((id) => id !== windowId);
		const top = this.state.modalStack.at(-1) ?? null;
		this.setActiveWindow(top);
	}

	setTransientFor(windowId: string, parentId: string | null): void {
		this.state.transientFor[windowId] = parentId;
	}

	setFocusOwner(windowId: string, widgetId: string | null): void {
		this.state.focusOwners[windowId] = widgetId;
	}

	getFocusOwner(windowId: string): string | null {
		return this.state.focusOwners[windowId] ?? null;
	}

	private resolveTransientRoot(windowId: string): string {
		let cursor: string | null = windowId;
		const visited = new Set<string>();
		while (cursor) {
			if (visited.has(cursor)) break;
			visited.add(cursor);
			const parent = this.state.transientFor[cursor] ?? null;
			if (!parent) return cursor;
			cursor = parent;
		}
		return windowId;
	}
}

export const createWindowGraph = (initial?: Partial<WindowGraphState>) => new WindowGraph(initial);
