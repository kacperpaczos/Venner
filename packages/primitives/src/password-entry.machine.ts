import { createMachine } from "@zag-js/core";

export const passwordEntryMachine = createMachine({
	id: "password-entry",
	props({ props }: any) {
		return { disabled: false, value: "", revealed: false, onValueChange: undefined, onRevealChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			value: bindable(() => ({ defaultValue: String(prop("value") ?? "") })),
			revealed: bindable(() => ({ defaultValue: Boolean(prop("revealed")) })),
		};
	},
	states: {
		idle: {
			on: {
				INPUT: [{ actions: ["setValue", "emitValue"] }],
				TOGGLE_REVEAL: [{ actions: ["toggleReveal", "emitReveal"] }],
			},
		},
	},
	implementations: {
		actions: {
			setValue: ({ context, event }: any) => context.set("value", String(event.value ?? "")),
			toggleReveal: ({ context }: any) => context.set("revealed", !Boolean(context.get("revealed"))),
			emitValue: ({ context, prop }: any) => {
				const onValueChange = prop("onValueChange");
				if (typeof onValueChange === "function") onValueChange(String(context.get("value")));
			},
			emitReveal: ({ context, prop }: any) => {
				const onRevealChange = prop("onRevealChange");
				if (typeof onRevealChange === "function") onRevealChange(Boolean(context.get("revealed")));
			},
		},
	},
} as any);
