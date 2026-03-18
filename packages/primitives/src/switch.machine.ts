import { createMachine } from "@zag-js/core";

export interface SwitchProps {
	disabled?: boolean;
	checked?: boolean;
	onChange?: (checked: boolean) => void;
}

export const switchMachine = createMachine({
	id: "switch",

	props({ props }: any) {
		return {
			disabled: false,
			checked: false,
			onChange: undefined,
			...props,
		};
	},

	initialState() {
		return "idle";
	},

	context({ bindable, prop }: any) {
		return {
			checked: bindable(() => ({ defaultValue: Boolean(prop("checked")) })),
			hovered: bindable(() => ({ defaultValue: false })),
			focused: bindable(() => ({ defaultValue: false })),
		};
	},

	states: {
		idle: {
			on: {
				TOGGLE: [{ guard: "canInteract", actions: ["toggleChecked", "emitChange"] }],
				POINTER_ENTER: [{ actions: ["setHovered"] }],
				POINTER_LEAVE: [{ actions: ["clearHovered"] }],
				TOUCH_END: [{ guard: "canInteract", actions: ["toggleChecked", "emitChange"] }],
				FOCUS: [{ actions: ["setFocused"] }],
				BLUR: [{ actions: ["clearFocused"] }],
				POINTER_CANCEL: [{ actions: ["clearHovered", "clearFocused"] }],
			},
		},
	},

	implementations: {
		guards: {
			canInteract: ({ prop }: any) => !Boolean(prop("disabled")),
		},
		actions: {
			toggleChecked: ({ context }: any) =>
				context.set("checked", !Boolean(context.get("checked"))),
			emitChange: ({ context, prop }: any) => {
				const onChange = prop("onChange");
				if (typeof onChange === "function") onChange(Boolean(context.get("checked")));
			},
			setHovered: ({ context }: any) => context.set("hovered", true),
			clearHovered: ({ context }: any) => context.set("hovered", false),
			setFocused: ({ context }: any) => context.set("focused", true),
			clearFocused: ({ context }: any) => context.set("focused", false),
		},
	},
} as any);
