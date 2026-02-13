import { createMachine } from "@zag-js/core";

export const flowBoxMachine = createMachine({
	id: "flow-box",
	props({ props }: any) {
		return { items: [], ...props };
	},
	initialState() {
		return "idle";
	},
	states: { idle: {} },
} as any);
