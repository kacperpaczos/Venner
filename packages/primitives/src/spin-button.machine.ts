import { createMachine } from "@zag-js/core";

export const spinButtonMachine = createMachine({
	id: "spin-button",
	props({ props }: any) {
		return { value: 0, min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, step: 1, disabled: false, onValueChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			value: bindable(() => ({ defaultValue: Number(prop("value") ?? 0) })),
		};
	},
	states: {
		idle: {
			on: {
				SET_VALUE: [{ guard: "canInteract", actions: ["setValue", "emitChange"] }],
				INCREMENT: [{ guard: "canInteract", actions: ["increment", "emitChange"] }],
				DECREMENT: [{ guard: "canInteract", actions: ["decrement", "emitChange"] }],
			},
		},
	},
	implementations: {
		guards: {
			canInteract: ({ prop }: any) => !Boolean(prop("disabled")),
		},
		actions: {
			setValue: ({ context, event, prop }: any) => {
				const min = Number(prop("min"));
				const max = Number(prop("max"));
				const next = Math.max(min, Math.min(max, Number(event.value)));
				context.set("value", next);
			},
			increment: ({ context, prop }: any) => {
				const min = Number(prop("min"));
				const max = Number(prop("max"));
				const step = Number(prop("step"));
				const next = Math.max(min, Math.min(max, Number(context.get("value")) + step));
				context.set("value", next);
			},
			decrement: ({ context, prop }: any) => {
				const min = Number(prop("min"));
				const max = Number(prop("max"));
				const step = Number(prop("step"));
				const next = Math.max(min, Math.min(max, Number(context.get("value")) - step));
				context.set("value", next);
			},
			emitChange: ({ context, prop }: any) => {
				const onValueChange = prop("onValueChange");
				if (typeof onValueChange === "function") onValueChange(Number(context.get("value")));
			},
		},
	},
} as any);
