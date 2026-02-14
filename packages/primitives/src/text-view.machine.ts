import { createMachine } from "@zag-js/core";

export const textViewMachine = createMachine({
	id: "text-view",
	props({ props }: any) {
		return { value: "", onInput: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			value: bindable(() => ({ defaultValue: String(prop("value") ?? "") })),
		};
	},
	states: {
		idle: {
			on: {
				INPUT: [{ actions: ["setValue", "emitInput"] }],
			},
		},
	},
	implementations: {
		actions: {
			setValue: ({ context, event }: any) => context.set("value", String(event.value ?? "")),
			emitInput: ({ context, prop }: any) => {
				const onInput = prop("onInput");
				if (typeof onInput === "function") onInput(String(context.get("value") ?? ""));
			},
		},
	},
} as any);
