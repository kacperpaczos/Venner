import { describe, expect, test } from "bun:test";
import { spinButtonConnect } from "../spin-button.connect";

describe("spinButtonConnect", () => {
	test("exposes increment and decrement actions", () => {
		const events: unknown[] = [];
		const service = {
			context: { get: () => 10 },
			prop: (key: string) => ({ disabled: false, min: 0, max: 100, step: 1 }[key]),
			send: (event: unknown) => events.push(event),
		};
		const api = spinButtonConnect(service as any);
		api.incProps.onClick();
		api.decProps.onClick();
		expect(events).toEqual([{ type: "INCREMENT" }, { type: "DECREMENT" }]);
	});
});
