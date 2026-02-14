import { createMachine } from "@zag-js/core";

export const actionBarMachine = createMachine({
	id: "action-bar",
	initialState() {
		return "idle";
	},
	states: { idle: {} },
} as any);
