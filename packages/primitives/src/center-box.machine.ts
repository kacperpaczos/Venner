import { createMachine } from "@zag-js/core";

export const centerBoxMachine = createMachine({
	id: "center-box",
	initialState() {
		return "idle";
	},
	states: { idle: {} },
} as any);
