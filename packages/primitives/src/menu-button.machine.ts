import { createMachine } from "@zag-js/core";

export const menuButtonMachine = createMachine({
	id: "menu-button",
	props({ props }: any) {
		return { disabled: false, open: false, onOpenChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			open: bindable(() => ({ defaultValue: Boolean(prop("open")) })),
		};
	},
	states: {
		idle: {
			on: {
				TOGGLE: [{ guard: "canInteract", actions: ["toggleOpen", "emitChange"] }],
				SET_OPEN: [{ guard: "canInteract", actions: ["setOpen", "emitChange"] }],
			},
		},
	},
	implementations: {
		guards: {
			canInteract: ({ prop }: any) => !Boolean(prop("disabled")),
		},
		actions: {
			toggleOpen: ({ context }: any) => context.set("open", !Boolean(context.get("open"))),
			setOpen: ({ context, event }: any) => context.set("open", Boolean(event.open)),
			emitChange: ({ context, prop }: any) => {
				const onOpenChange = prop("onOpenChange");
				if (typeof onOpenChange === "function") onOpenChange(Boolean(context.get("open")));
			},
		},
	},
} as any);
