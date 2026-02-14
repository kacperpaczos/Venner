import { createMachine } from "@zag-js/core";

export const popoverMachine = createMachine({
	id: "popover",
	props({ props }: any) {
		return { open: false, onOpenChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return { open: bindable(() => ({ defaultValue: Boolean(prop("open")) })) };
	},
	states: {
		idle: {
			on: {
				TOGGLE: [{ actions: ["toggleOpen", "emitChange"] }],
				SET_OPEN: [{ actions: ["setOpen", "emitChange"] }],
			},
		},
	},
	implementations: {
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
