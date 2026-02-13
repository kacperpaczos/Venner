import { createMachine } from "@zag-js/core";

export const linkButtonMachine = createMachine({
	id: "link-button",
	props({ props }: any) {
		return { disabled: false, onNavigate: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable }: any) {
		return {
			hovered: bindable(() => ({ defaultValue: false })),
			focused: bindable(() => ({ defaultValue: false })),
		};
	},
	states: {
		idle: {
			on: {
				CLICK: [{ guard: "canInteract", actions: ["emitNavigate"] }],
				POINTER_ENTER: [{ actions: ["setHovered"] }],
				POINTER_LEAVE: [{ actions: ["clearHovered"] }],
				FOCUS: [{ actions: ["setFocused"] }],
				BLUR: [{ actions: ["clearFocused"] }],
			},
		},
	},
	implementations: {
		guards: { canInteract: ({ prop }: any) => !Boolean(prop("disabled")) },
		actions: {
			emitNavigate: ({ prop }: any) => {
				const onNavigate = prop("onNavigate");
				if (typeof onNavigate === "function") onNavigate();
			},
			setHovered: ({ context }: any) => context.set("hovered", true),
			clearHovered: ({ context }: any) => context.set("hovered", false),
			setFocused: ({ context }: any) => context.set("focused", true),
			clearFocused: ({ context }: any) => context.set("focused", false),
		},
	},
} as any);
