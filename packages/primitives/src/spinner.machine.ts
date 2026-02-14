import { createMachine } from "@zag-js/core";

export const spinnerMachine = createMachine({
	id: "spinner",
	props({ props }: any) {
		return { active: true, size: "md", ...props };
	},
	initialState() {
		return "idle";
	},
	states: { idle: {} },
} as any);
