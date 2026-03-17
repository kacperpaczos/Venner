/**
 * Type definitions for Venner Core
 */

export interface SessionState {
	currentWindowId: string;
	activeRoute: string;
	workflowStage: string;
	uiScale: number;
}

export interface ScrollState {
	x: number;
	y: number;
	anchorId: string | null;
}

export interface ViewportState {
	zoom: number;
	density: string | null;
	breakpoint: string | null;
}

export interface WindowState {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	maximized: boolean;
	focused: boolean;
	route: string;
	scroll: ScrollState;
	viewport: ViewportState;
}

export interface WidgetState {
	id: string;
	kind: string;
	disabled: boolean;
	persistent: Record<string, unknown> | unknown;
	transient: Record<string, unknown> | unknown;
	updatedAt: number;
	source: string;
}

export interface FocusState {
	widgetId: string | null;
	caretStart: number | null;
	caretEnd: number | null;
}

export interface UiState {
	tabs: Record<string, string>;
	focus: FocusState;
	panels: Record<string, boolean>;
	lastUpdatedAt: number;
}

export interface ThemeTokens {
	bg: string;
	fg: string;
	accent: string;
}

export interface AppState {
	version: number;
	schemaVersion: number;
	session: SessionState;
	windows: Record<string, WindowState>;
	widgets: Record<string, WidgetState>;
	ui: UiState;
	theme: ThemeTokens;
}

export interface PersistedAppState {
	schemaVersion: number;
	exportedAt: number;
	appVersion: string;
	state: AppState;
}

export interface ValidationReport {
	valid: boolean;
	schemaVersion: number | null;
	targetSchemaVersion: number;
	errors: string[];
	warnings: string[];
}

export interface ImportResult {
	applied: boolean;
	migratedFrom: number | null;
	schemaVersion: number;
	warnings: string[];
	errors: string[];
}

export interface NativeDialogResult {
	applied: boolean;
	cancelled: boolean;
	value: string | null;
	error: string | null;
}

export interface AboutDialogResult {
	applied: boolean;
	error: string | null;
}

export type ThemeSource = "system" | "project" | "default";

export interface ThemeDiagnostics {
	desktopEnv: string;
	schema: string;
	gtkTheme: string;
	colorScheme: string;
	source: ThemeSource;
	resolvedCssPath: string | null;
	resolvedGtkVersion: string;
	fallbackReason: string | null;
	tokensCount: number;
	loadedAt: number;
	coverage: {
		window: {
			headerbar: number;
			windowcontrols: number;
			titleButtons: number;
		};
	};
	missingSelectors: string[];
	missingProps: string[];
}

export interface CompiledGtkTheme {
	tokens: Record<string, string>;
	window: CompiledWindowTheme;
	widgets: CompiledWidgetsTheme;
	meta: CompiledGtkThemeMeta;
}

export interface CompiledGtkThemeMeta {
	gtkVersion: string;
	sourcePath: string | null;
	themeName: string;
	colorScheme: string;
	hash: string;
	contractVersion: string;
}

export interface CompiledWindowTheme {
	headerbar: {
		minHeight?: string;
		padding?: string;
		borderColor?: string;
		borderWidth?: string;
		borderStyle?: string;
		backgroundColor?: string;
		backgroundImage?: string;
		boxShadow?: string;
		transition?: string;
		titlePadding?: string;
		subtitlePadding?: string;
		subtitleFontSize?: string;
	};
	windowcontrols: {
		spacing?: string;
		marginStart?: string;
		marginEnd?: string;
		buttonMinWidth?: string;
		buttonMinHeight?: string;
		buttonPadding?: string;
		buttonBorderColor?: string;
		buttonBackgroundColor?: string;
		buttonHoverBorderColor?: string;
		buttonHoverBackgroundColor?: string;
		buttonActiveBorderColor?: string;
		buttonActiveBackgroundColor?: string;
		buttonBorder?: string;
		buttonBoxShadow?: string;
		buttonBackgroundImage?: string;
		iconCarrier: {
			minWidth?: string;
			minHeight?: string;
			borderRadius?: string;
			backgroundColor?: string;
			backgroundImage?: string;
			boxShadow?: string;
			hoverBackgroundColor?: string;
			activeBackgroundColor?: string;
			disabledBackgroundColor?: string;
		};
	};
	titleButtons: {
		close: CompiledTitleButton;
		maximize: CompiledTitleButton;
		minimize: CompiledTitleButton;
	};
	backdrop: {
		headerbarColor?: string;
		closeBackgroundImage?: string;
		maximizeColor?: string;
		minimizeColor?: string;
	};
	layout: {
		controlsSpacing?: string;
		controlsMarginStart?: string;
		controlsMarginEnd?: string;
		endLastButtonPaddingRight?: string;
	};
}

export interface CompiledTitleButton {
	color?: string;
	hoverColor?: string;
	activeColor?: string;
	backgroundImage?: string;
	hoverBackgroundImage?: string;
	activeBackgroundImage?: string;
	icon: {
		symbolicName?: string;
		resolvedSource?: "system-icon" | "css-image" | "fallback-svg";
		resolvedCssMask?: string;
		resolvedUrl?: string;
	};
}

export interface CompiledWidgetsTheme {
	button: {
		minHeight?: string;
		minWidth?: string;
		padding?: string;
		borderRadius?: string;
		borderColor?: string;
		backgroundColor?: string;
		color?: string;
		hoverBorderColor?: string;
		hoverBackgroundColor?: string;
		activeBorderColor?: string;
		activeBackgroundColor?: string;
		disabledColor?: string;
		disabledBorderColor?: string;
		disabledBackgroundColor?: string;
	};
	entry: {
		minHeight?: string;
		padding?: string;
		borderRadius?: string;
		borderColor?: string;
		backgroundColor?: string;
		color?: string;
		focusBorderColor?: string;
		disabledColor?: string;
		disabledBackgroundColor?: string;
	};
}

export type Action =
	| { type: "WidgetRegister"; widget_id: string; kind: string; initial?: unknown }
	| { type: "WidgetStatePatch"; widget_id: string; patch: unknown }
	| { type: "WidgetTransient"; widget_id: string; transient: unknown }
	| { type: "WidgetCommit"; widget_id: string; value: unknown }
	| { type: "WidgetDisable"; widget_id: string; disabled: boolean }
	| { type: "WidgetUpdate"; widget_id: string; field: string; value: unknown }
	| { type: "WindowResize"; window_id: string; width: number; height: number }
	| { type: "WindowMove"; window_id: string; x: number; y: number }
	| { type: "SessionUpdate"; patch: Record<string, unknown> }
	| {
			type: "WindowScroll";
			window_id: string;
			x: number;
			y: number;
			anchor_id?: string | null;
	  }
	| {
			type: "WindowViewport";
			window_id: string;
			zoom: number;
			density?: string | null;
			breakpoint?: string | null;
	  }
	| { type: "UiTabsUpdate"; id: string; active_tab: string }
	| {
			type: "UiFocusUpdate";
			widget_id?: string | null;
			caret_start?: number | null;
			caret_end?: number | null;
	  }
	| { type: "UiPanelUpdate"; id: string; collapsed: boolean }
	| { type: "Navigate"; window_id: string; route: string }
	| { type: "ThemeChanged"; tokens: ThemeTokens };
