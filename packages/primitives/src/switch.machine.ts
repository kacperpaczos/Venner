import { createMachine } from "@zag-js/core";

/**
 * Switch machine - headless state machine for toggle/switch component
 */

export interface SwitchContext {
	checked: boolean;
	disabled: boolean;
	focused: boolean;
	hovered: boolean;
}

export const switchMachine = createMachine({
	id: "switch",
	initial: "unchecked",

	context: {
		checked: false,
		disabled: false,
		focused: false,
		hovered: false,
	} as SwitchContext,

	states: {
		unchecked: {
			on: {
				TOGGLE: {
					target: "checked",
					actions: ["setChecked"],
				},
				POINTER_ENTER: { actions: ["setHovered"] },
				POINTER_LEAVE: { actions: ["clearHovered"] },
				FOCUS: { actions: ["setFocused"] },
				BLUR: { actions: ["clearFocused"] },
			},
		},

		checked: {
			on: {
				TOGGLE: {
					target: "unchecked",
					actions: ["clearChecked"],
				},
				POINTER_ENTER: { actions: ["setHovered"] },
				POINTER_LEAVE: { actions: ["clearHovered"] },
				FOCUS: { actions: ["setFocused"] },
				BLUR: { actions: ["clearFocused"] },
			},
		},
	},

	actions: {
		setChecked: (ctx) => ({ ...ctx, checked: true }),
		clearChecked: (ctx) => ({ ...ctx, checked: false }),
		setHovered: (ctx) => ({ ...ctx, hovered: true }),
		clearHovered: (ctx) => ({ ...ctx, hovered: false }),
		setFocused: (ctx) => ({ ...ctx, focused: true }),
		clearFocused: (ctx) => ({ ...ctx, focused: false }),
	},
});
