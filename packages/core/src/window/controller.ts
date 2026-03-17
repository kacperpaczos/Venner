import { invoke } from "../api/invoke";
import type {
	WindowBehaviorProfile,
	WindowCommandResult,
	WindowController,
	WindowRuntimeState,
} from "./types";

type WindowInvoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

const toError = (error: unknown) => {
	if (error instanceof Error) return error.message;
	return String(error);
};

export function createWindowController(call: WindowInvoke = invoke): WindowController {
	const exec = async (cmd: string, args?: Record<string, unknown>): Promise<WindowCommandResult> => {
		try {
			return await call<WindowCommandResult>(cmd, args);
		} catch (error) {
			return { ok: false, error: toError(error) };
		}
	};

	const resolveNativeDecorations = (profile: WindowBehaviorProfile) => {
		if (typeof profile.nativeDecorations === "boolean") return profile.nativeDecorations;
		if (typeof profile.decorated === "boolean") return profile.decorated;
		return false;
	};

	return {
		getState: () => call<WindowRuntimeState>("window_get_runtime_state"),
		applyProfile: (profile: WindowBehaviorProfile) =>
			exec("window_apply_profile", {
				profile: {
					...profile,
					nativeDecorations: resolveNativeDecorations(profile),
				},
			}),
		setNativeDecorations: (value: boolean) => exec("window_set_native_decorations", { value }),
		setResizable: (value: boolean) => exec("window_set_resizable", { value }),
		minimize: () => exec("window_minimize"),
		toggleMaximize: () => exec("window_toggle_maximize"),
		setFullscreen: (value: boolean) => exec("window_set_fullscreen", { value }),
		startDragging: () => exec("window_start_dragging"),
		closeRequest: () => exec("window_close_request"),
		present: () => exec("window_present"),
	};
}

export const windowController = createWindowController();
