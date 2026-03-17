import { describe, expect, test } from "bun:test";
import { createWindowController } from "../controller";
import type { WindowBehaviorProfile } from "../types";

describe("windowController", () => {
	test("maps commands to invoke names", async () => {
		const calls: Array<{ cmd: string; args?: Record<string, unknown> }> = [];
		const invoke = async <T>(cmd: string, args?: Record<string, unknown>) => {
			calls.push({ cmd, args });
			if (cmd === "window_get_runtime_state") {
				return {
					label: "main",
					nativeDecorations: true,
					resizable: true,
					maximized: false,
					minimized: false,
					fullscreen: false,
					visible: true,
					focused: true,
					x: 0,
					y: 0,
					width: 100,
					height: 100,
				} as T;
			}
			return { ok: true, error: null } as T;
		};

		const controller = createWindowController(invoke);
		const profile: WindowBehaviorProfile = {
			id: "default",
			nativeDecorations: true,
			chromeStyle: "system-gtk",
			resizable: true,
			allowMinimize: true,
			allowMaximize: true,
			allowFullscreen: true,
			themeMode: "system-follow",
		};

		await controller.getState();
		await controller.applyProfile(profile);
		await controller.setNativeDecorations(false);
		await controller.setResizable(false);
		await controller.minimize();
		await controller.toggleMaximize();
		await controller.setFullscreen(true);
		await controller.startDragging();
		await controller.closeRequest();
		await controller.present();

		expect(calls.map((item) => item.cmd)).toEqual([
			"window_get_runtime_state",
			"window_apply_profile",
			"window_set_native_decorations",
			"window_set_resizable",
			"window_minimize",
			"window_toggle_maximize",
			"window_set_fullscreen",
			"window_start_dragging",
			"window_close_request",
			"window_present",
		]);
	});

	test("returns normalized error on invoke failure", async () => {
		const invoke = async <T>(_cmd: string): Promise<T> => {
			throw new Error("boom");
		};
		const controller = createWindowController(invoke);
		const result = await controller.minimize();
		expect(result.ok).toBe(false);
		expect(result.error).toContain("boom");
	});

	test("maps deprecated decorated field to nativeDecorations", async () => {
		const calls: Array<{ cmd: string; args?: Record<string, unknown> }> = [];
		const invoke = async <T>(cmd: string, args?: Record<string, unknown>) => {
			calls.push({ cmd, args });
			return { ok: true, error: null } as T;
		};
		const controller = createWindowController(invoke);

		await controller.applyProfile({
			id: "legacy",
			decorated: true,
			chromeStyle: "system-gtk",
			resizable: true,
			allowMinimize: true,
			allowMaximize: true,
			allowFullscreen: true,
			themeMode: "system-follow",
		} as WindowBehaviorProfile);

		expect(calls).toHaveLength(1);
		expect(calls[0]?.cmd).toBe("window_apply_profile");
		expect((calls[0]?.args?.profile as Record<string, unknown>).nativeDecorations).toBe(true);
	});
});
