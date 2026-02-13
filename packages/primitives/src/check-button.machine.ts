import { createMachine } from "@zag-js/core";

export const checkButtonMachine = createMachine({
	id: "check-button",
	props({ props }: any) {
		return { disabled: false, checked: false, onCheckedChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			checked: bindable(() => ({ defaultValue: Boolean(prop("checked")) })),
			focused: bindable(() => ({ defaultValue: false })),
		};
	},
	states: {
		idle: {
			on: {
				SET_CHECKED: [{ guard: "canInteract", actions: ["setChecked", "emitChange"] }],
				FOCUS: [{ actions: ["setFocused"] }],
				BLUR: [{ actions: ["clearFocused"] }],
			},
		},
	},
	implementations: {
		guards: {
			canInteract: ({ prop }: any) => !Boolean(prop("disabled")),
		},
		actions: {
			setChecked: ({ context, event }: any) => context.set("checked", Boolean(event.checked)),
			emitChange: ({ context, prop }: any) => {
				const onCheckedChange = prop("onCheckedChange");
				if (typeof onCheckedChange === "function") onCheckedChange(Boolean(context.get("checked")));
			},
			setFocused: ({ context }: any) => context.set("focused", true),
			clearFocused: ({ context }: any) => context.set("focused", false),
		},
	},
} as any);
