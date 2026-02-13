import { createMachine } from "@zag-js/core";

export const searchEntryMachine = createMachine({
	id: "search-entry",
	props({ props }: any) {
		return { disabled: false, value: "", onValueChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			value: bindable(() => ({ defaultValue: String(prop("value") ?? "") })),
			focused: bindable(() => ({ defaultValue: false })),
		};
	},
	states: {
		idle: {
			on: {
				INPUT: [{ actions: ["setValue", "emitChange"] }],
				FOCUS: [{ actions: ["setFocused"] }],
				BLUR: [{ actions: ["clearFocused"] }],
			},
		},
	},
	implementations: {
		actions: {
			setValue: ({ context, event }: any) => context.set("value", String(event.value ?? "")),
			emitChange: ({ context, prop }: any) => {
				const onValueChange = prop("onValueChange");
				if (typeof onValueChange === "function") onValueChange(String(context.get("value")));
			},
			setFocused: ({ context }: any) => context.set("focused", true),
			clearFocused: ({ context }: any) => context.set("focused", false),
		},
	},
} as any);
