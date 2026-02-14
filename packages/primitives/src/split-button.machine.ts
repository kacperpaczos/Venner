import { createMachine } from "@zag-js/core";

export const splitButtonMachine = createMachine({
	id: "split-button",
	props({ props }: any) {
		return { onPrimary: undefined, onMenu: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable }: any) {
		return { menuOpen: bindable(() => ({ defaultValue: false })) };
	},
	states: {
		idle: {
			on: {
				PRIMARY: [{ actions: ["emitPrimary"] }],
				MENU: [{ actions: ["toggleMenu", "emitMenu"] }],
			},
		},
	},
	implementations: {
		actions: {
			emitPrimary: ({ prop }: any) => {
				const onPrimary = prop("onPrimary");
				if (typeof onPrimary === "function") onPrimary();
			},
			toggleMenu: ({ context }: any) => context.set("menuOpen", !Boolean(context.get("menuOpen"))),
			emitMenu: ({ prop }: any) => {
				const onMenu = prop("onMenu");
				if (typeof onMenu === "function") onMenu();
			},
		},
	},
} as any);
