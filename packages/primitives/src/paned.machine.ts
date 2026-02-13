import { createMachine } from "@zag-js/core";

export const panedMachine = createMachine({
	id: "paned",
	props({ props }: any) {
		return { split: 50, min: 15, max: 85, onSplitChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return { split: bindable(() => ({ defaultValue: Number(prop("split") ?? 50) })) };
	},
	states: {
		idle: {
			on: {
				SET_SPLIT: [{ actions: ["setSplit", "emitChange"] }],
			},
		},
	},
	implementations: {
		actions: {
			setSplit: ({ context, event, prop }: any) => {
				const min = Number(prop("min") ?? 15);
				const max = Number(prop("max") ?? 85);
				const next = Math.max(min, Math.min(max, Number(event.split)));
				context.set("split", next);
			},
			emitChange: ({ context, prop }: any) => {
				const onSplitChange = prop("onSplitChange");
				if (typeof onSplitChange === "function") onSplitChange(Number(context.get("split")));
			},
		},
	},
} as any);
