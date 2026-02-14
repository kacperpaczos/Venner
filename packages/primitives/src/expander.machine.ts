import { createMachine } from "@zag-js/core";

export const expanderMachine = createMachine({
	id: "expander",
	props({ props }: any) {
		return { expanded: false, onExpandedChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return { expanded: bindable(() => ({ defaultValue: Boolean(prop("expanded")) })) };
	},
	states: {
		idle: {
			on: {
				TOGGLE: [{ actions: ["toggleExpanded", "emitChange"] }],
			},
		},
	},
	implementations: {
		actions: {
			toggleExpanded: ({ context }: any) => context.set("expanded", !Boolean(context.get("expanded"))),
			emitChange: ({ context, prop }: any) => {
				const onExpandedChange = prop("onExpandedChange");
				if (typeof onExpandedChange === "function") onExpandedChange(Boolean(context.get("expanded")));
			},
		},
	},
} as any);
