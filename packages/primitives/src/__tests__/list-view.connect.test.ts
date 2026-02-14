import { describe, expect, test } from "bun:test";
import { listViewConnect } from "../list-view.connect";

describe("listViewConnect", () => {
	test("handles keyboard navigation events", () => {
		const events: unknown[] = [];
		const service = {
			context: { get: (key: string) => ({ selectedId: "row-2", activeIndex: 1 }[key]) },
			send: (event: unknown) => events.push(event),
		};
		const api = listViewConnect(service as any);
		api.rootProps.onKeyDown({ key: "ArrowDown", preventDefault() {} } as KeyboardEvent);
		api.rootProps.onKeyDown({ key: "Enter", preventDefault() {} } as KeyboardEvent);
		expect(events).toEqual([{ type: "MOVE", delta: 1 }, { type: "ACTIVATE" }]);
	});
});
