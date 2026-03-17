export interface WindowRuntimeState {
	label: string;
	nativeDecorations: boolean;
	resizable: boolean;
	maximized: boolean;
	minimized: boolean;
	fullscreen: boolean;
	visible: boolean;
	focused: boolean;
	x: number | null;
	y: number | null;
	width: number | null;
	height: number | null;
}

export interface WindowBehaviorProfile {
	id: string;
	nativeDecorations: boolean;
	chromeStyle: "system-gtk" | "debug-transparent";
	/** @deprecated use nativeDecorations */
	decorated?: boolean;
	resizable: boolean;
	allowMinimize: boolean;
	allowMaximize: boolean;
	allowFullscreen: boolean;
	themeMode: "system-follow";
}

export interface WindowCommandResult {
	ok: boolean;
	error: string | null;
}

export interface WindowController {
	getState(): Promise<WindowRuntimeState>;
	applyProfile(profile: WindowBehaviorProfile): Promise<WindowCommandResult>;
	setNativeDecorations(value: boolean): Promise<WindowCommandResult>;
	setResizable(value: boolean): Promise<WindowCommandResult>;
	minimize(): Promise<WindowCommandResult>;
	toggleMaximize(): Promise<WindowCommandResult>;
	setFullscreen(value: boolean): Promise<WindowCommandResult>;
	startDragging(): Promise<WindowCommandResult>;
	closeRequest(): Promise<WindowCommandResult>;
	present(): Promise<WindowCommandResult>;
}

export interface WindowGraphState {
	activeWindowId: string | null;
	modalStack: string[];
	transientFor: Record<string, string | null>;
	focusOwners: Record<string, string | null>;
}
