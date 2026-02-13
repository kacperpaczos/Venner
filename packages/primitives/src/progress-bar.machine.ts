import { createMachine } from "@zag-js/core";

export const progressBarMachine = createMachine({
	id: "progress-bar",
	props({ props }: any) {
		return { value: 0, max: 100, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			value: bindable(() => ({ defaultValue: Number(prop("value") ?? 0) })),
		};
	},
	states: { idle: {} },
} as any);
