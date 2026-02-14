import { createMachine } from "@zag-js/core";

export const dropdownMachine = createMachine({
	id: "dropdown",
	props({ props }: any) {
		return { value: "", disabled: false, onChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			value: bindable(() => ({ defaultValue: String(prop("value") ?? "") })),
			open: bindable(() => ({ defaultValue: false })),
			focused: bindable(() => ({ defaultValue: false })),
		};
	},
	states: {
		idle: {
			on: {
				SET_VALUE: [{ actions: ["setValue", "emitChange"] }],
				SET_OPEN: [{ actions: ["setOpen"] }],
				FOCUS: [{ actions: ["setFocused"] }],
				BLUR: [{ actions: ["clearFocused", "close"] }],
			},
		},
	},
	implementations: {
		actions: {
			setValue: ({ context, event }: any) => context.set("value", String(event.value ?? "")),
			setOpen: ({ context, event }: any) => context.set("open", Boolean(event.open)),
			close: ({ context }: any) => context.set("open", false),
			setFocused: ({ context }: any) => context.set("focused", true),
			clearFocused: ({ context }: any) => context.set("focused", false),
			emitChange: ({ context, prop }: any) => {
				const onChange = prop("onChange");
				if (typeof onChange === "function") onChange(String(context.get("value") ?? ""));
			},
		},
	},
} as any);
