import { createMachine } from "@zag-js/core";

export const headerBarMachine = createMachine({
	id: "header-bar",
	props({ props }: any) {
		return { title: "", ...props };
	},
	initialState() {
		return "idle";
	},
	states: { idle: {} },
} as any);
