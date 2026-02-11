/**
 * Type definitions for Venner Core
 *
 * These will be generated from Rust using Specta.
 * For now, using placeholder types.
 */

export interface AppState {
	version: number;
	windows: Record<string, WindowState>;
	widgets: Record<string, WidgetState>;
	theme: ThemeTokens;
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
}

export interface WidgetState {
	id: string;
	kind: string;
	props: Record<string, unknown>;
}

export interface ThemeTokens {
	bg: string;
	fg: string;
	accent: string;
}

export type Action =
	| { type: "WidgetUpdate"; widget_id: string; field: string; value: unknown }
	| { type: "WindowResize"; window_id: string; width: number; height: number }
	| { type: "WindowMove"; window_id: string; x: number; y: number }
	| { type: "Navigate"; window_id: string; route: string }
	| { type: "ThemeChanged"; tokens: ThemeTokens };
