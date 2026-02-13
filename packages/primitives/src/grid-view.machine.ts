import { createMachine } from "@zag-js/core";

export const gridViewMachine = createMachine({
	id: "grid-view",
	props({ props }: any) {
		return { selectedId: null, onSelect: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return { selectedId: bindable(() => ({ defaultValue: prop("selectedId") ?? null })) };
	},
	states: {
		idle: {
			on: {
				SELECT: [{ actions: ["setSelected", "emitSelect"] }],
			},
		},
	},
	implementations: {
		actions: {
			setSelected: ({ context, event }: any) => context.set("selectedId", String(event.id ?? "")),
			emitSelect: ({ context, prop }: any) => {
				const onSelect = prop("onSelect");
				if (typeof onSelect === "function") onSelect(String(context.get("selectedId") ?? ""));
			},
		},
	},
} as any);
