import { createMachine } from "@zag-js/core";

export const toggleButtonMachine = createMachine({
	id: "toggle-button",
	props({ props }: any) {
		return { disabled: false, pressed: false, onPressedChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			pressed: bindable(() => ({ defaultValue: Boolean(prop("pressed")) })),
			hovered: bindable(() => ({ defaultValue: false })),
			focused: bindable(() => ({ defaultValue: false })),
		};
	},
	states: {
		idle: {
			on: {
				TOGGLE: [{ guard: "canInteract", actions: ["togglePressed", "emitChange"] }],
				POINTER_ENTER: [{ actions: ["setHovered"] }],
				POINTER_LEAVE: [{ actions: ["clearHovered"] }],
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
			togglePressed: ({ context }: any) => context.set("pressed", !Boolean(context.get("pressed"))),
			emitChange: ({ context, prop }: any) => {
				const onPressedChange = prop("onPressedChange");
				if (typeof onPressedChange === "function") onPressedChange(Boolean(context.get("pressed")));
			},
			setHovered: ({ context }: any) => context.set("hovered", true),
			clearHovered: ({ context }: any) => context.set("hovered", false),
			setFocused: ({ context }: any) => context.set("focused", true),
			clearFocused: ({ context }: any) => context.set("focused", false),
		},
	},
} as any);
