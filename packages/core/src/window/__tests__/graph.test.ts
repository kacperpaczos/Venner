import { describe, expect, test } from "bun:test";
import { createWindowGraph } from "../graph";

describe("WindowGraph", () => {
	test("tracks modal stack and blocked windows", () => {
		const graph = createWindowGraph();
		graph.pushModal("modal-a");
		expect(graph.blockedByModal("modal-a")).toBe(false);
		expect(graph.blockedByModal("main")).toBe(true);
		graph.popModal("modal-a");
		expect(graph.blockedByModal("main")).toBe(false);
	});

	test("respects transient relation for modal blocking", () => {
		const graph = createWindowGraph();
		graph.setTransientFor("dialog-1", "main");
		graph.pushModal("main");
		expect(graph.blockedByModal("dialog-1")).toBe(false);
		expect(graph.blockedByModal("other")).toBe(true);
	});

	test("stores focus owner per window", () => {
		const graph = createWindowGraph();
		graph.setFocusOwner("main", "entry.search");
		expect(graph.getFocusOwner("main")).toBe("entry.search");
		graph.setFocusOwner("main", null);
		expect(graph.getFocusOwner("main")).toBeNull();
	});
});
