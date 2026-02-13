import { createMachine } from "@zag-js/core";

export const listBoxMachine = createMachine({
	id: "list-box",
	props({ props }: any) {
		return { items: [], activeId: null, onChange: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			activeId: bindable(() => ({ defaultValue: prop("activeId") ?? null })),
		};
	},
	states: {
		idle: {
			on: {
				SELECT: [{ actions: ["setActive", "emitChange"] }],
			},
		},
	},
	implementations: {
		actions: {
			setActive: ({ context, event }: any) => context.set("activeId", String(event.id ?? "")),
			emitChange: ({ context, prop }: any) => {
				const onChange = prop("onChange");
				if (typeof onChange === "function") onChange(String(context.get("activeId") ?? ""));
			},
		},
	},
} as any);
