import { describe, expect, test } from "bun:test";
import { toggleButtonConnect } from "../toggle-button.connect";

describe("toggleButtonConnect", () => {
	test("maps state and dispatches TOGGLE", () => {
		let sent: unknown = null;
		const service = {
			context: { get: (key: string) => ({ pressed: true, hovered: false, focused: true }[key]) },
			prop: (key: string) => ({ disabled: false }[key]),
			send: (event: unknown) => {
				sent = event;
			},
		};
		const api = toggleButtonConnect(service as any);
		expect(api.state.pressed).toBe(true);
		api.rootProps.onClick();
		expect(sent).toEqual({ type: "TOGGLE" });
	});
});
