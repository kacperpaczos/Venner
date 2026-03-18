import { createMachine } from "@zag-js/core";

export interface ButtonProps {
	disabled?: boolean;
	variant?: "default" | "suggested" | "destructive" | "secondary" | "ghost" | "link";
	size?: "sm" | "md" | "lg";
	onClick?: () => void;
}

export const buttonMachine = createMachine({
	id: "button",

	props({ props }: any) {
		return {
			disabled: false,
			variant: "default",
			size: "md",
			onClick: undefined,
			...props,
		};
	},

	initialState() {
		return "idle";
	},

	context({ bindable }: any) {
		return {
			pressed: bindable(() => ({ defaultValue: false })),
			focused: bindable(() => ({ defaultValue: false })),
			hovered: bindable(() => ({ defaultValue: false })),
		};
	},

	states: {
		idle: {
			on: {
				POINTER_ENTER: [{ guard: "canInteract", target: "hover", actions: ["setHovered"] }],
				FOCUS: [{ guard: "canInteract", target: "focused", actions: ["setFocused"] }],
				KEY_DOWN: [{ guard: "isActivationKey", target: "active", actions: ["setPressed"] }],
				TOUCH_START: [{ guard: "canInteract", target: "active", actions: ["setPressed"] }],
				BLUR: [{ actions: ["clearFocused"] }],
				POINTER_LEAVE: [{ actions: ["clearHovered", "clearPressed"] }],
				POINTER_CANCEL: [{ actions: ["clearHovered", "clearFocused", "clearPressed"] }],
			},
		},

		hover: {
			on: {
				POINTER_LEAVE: [{ target: "idle", actions: ["clearHovered", "clearPressed"] }],
				POINTER_DOWN: [{ guard: "canInteract", target: "active", actions: ["setPressed"] }],
				TOUCH_START: [{ guard: "canInteract", target: "active", actions: ["setPressed"] }],
				FOCUS: [{ target: "focusedHover", actions: ["setFocused"] }],
				BLUR: [{ target: "idle", actions: ["clearFocused"] }],
				POINTER_CANCEL: [{ target: "idle", actions: ["clearHovered", "clearFocused", "clearPressed"] }],
			},
		},

		focused: {
			on: {
				BLUR: [{ target: "idle", actions: ["clearFocused", "clearPressed"] }],
				POINTER_ENTER: [{ target: "focusedHover", actions: ["setHovered"] }],
				KEY_DOWN: [{ guard: "isActivationKey", target: "active", actions: ["setPressed"] }],
				TOUCH_START: [{ guard: "canInteract", target: "active", actions: ["setPressed"] }],
				POINTER_CANCEL: [{ target: "idle", actions: ["clearHovered", "clearFocused", "clearPressed"] }],
			},
		},

		focusedHover: {
			on: {
				POINTER_LEAVE: [{ target: "focused", actions: ["clearHovered"] }],
				POINTER_DOWN: [{ guard: "canInteract", target: "active", actions: ["setPressed"] }],
				TOUCH_START: [{ guard: "canInteract", target: "active", actions: ["setPressed"] }],
				BLUR: [{ target: "hover", actions: ["clearFocused"] }],
				POINTER_CANCEL: [{ target: "idle", actions: ["clearHovered", "clearFocused", "clearPressed"] }],
			},
		},

		active: {
			entry: ["setPressed"],
			on: {
				POINTER_UP: [{ target: "hover", actions: ["dispatchClick", "clearPressed"] }],
				KEY_UP: [{ guard: "isActivationKey", target: "focused", actions: ["dispatchClick", "clearPressed"] }],
				TOUCH_END: [{ target: "hover", actions: ["dispatchClick", "clearPressed"] }],
				POINTER_LEAVE: [{ target: "focused", actions: ["clearPressed", "clearHovered"] }],
				BLUR: [{ target: "idle", actions: ["clearFocused", "clearPressed"] }],
				POINTER_CANCEL: [{ target: "idle", actions: ["clearHovered", "clearFocused", "clearPressed"] }],
			},
		},
	},

	implementations: {
		guards: {
			canInteract: ({ prop }: any) => !Boolean(prop("disabled")),
			isActivationKey: ({
				event,
				prop,
			}: any) => !Boolean(prop("disabled")) && (event.key === "Enter" || event.key === " "),
		},

		actions: {
			setHovered: ({ context }: any) =>
				context.set("hovered", true),
			clearHovered: ({ context }: any) =>
				context.set("hovered", false),
			setFocused: ({ context }: any) =>
				context.set("focused", true),
			clearFocused: ({ context }: any) =>
				context.set("focused", false),
			setPressed: ({ context }: any) =>
				context.set("pressed", true),
			clearPressed: ({ context }: any) =>
				context.set("pressed", false),
			dispatchClick: ({ prop }: any) => {
				const onClick = prop("onClick");
				if (typeof onClick === "function") onClick();
			},
		},
	},
} as any);
