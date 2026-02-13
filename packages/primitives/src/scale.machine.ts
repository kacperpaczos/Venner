import { createMachine } from "@zag-js/core";

export const scaleMachine = createMachine({
	id: "scale",
	props({ props }: any) {
		return { value: 0, min: 0, max: 100, step: 1, disabled: false, onValueChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return { value: bindable(() => ({ defaultValue: Number(prop("value") ?? 0) })) };
	},
	states: {
		idle: {
			on: {
				SET_VALUE: [{ guard: "canInteract", actions: ["setValue", "emitChange"] }],
			},
		},
	},
	implementations: {
		guards: { canInteract: ({ prop }: any) => !Boolean(prop("disabled")) },
		actions: {
			setValue: ({ context, event, prop }: any) => {
				const min = Number(prop("min"));
				const max = Number(prop("max"));
				context.set("value", Math.max(min, Math.min(max, Number(event.value))));
			},
			emitChange: ({ context, prop }: any) => {
				const onValueChange = prop("onValueChange");
				if (typeof onValueChange === "function") onValueChange(Number(context.get("value")));
			},
		},
	},
} as any);
