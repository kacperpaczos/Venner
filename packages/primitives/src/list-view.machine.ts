import { createMachine } from "@zag-js/core";

export const listViewMachine = createMachine({
	id: "list-view",
	props({ props }: any) {
		return { items: [], selectedId: null, onSelect: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		const items = prop("items") as Array<{ id: string }>;
		const selectedId = prop("selectedId") as string | null;
		const activeIndex = Math.max(0, items.findIndex((item) => item.id === selectedId));
		return {
			selectedId: bindable(() => ({ defaultValue: selectedId })),
			activeIndex: bindable(() => ({ defaultValue: activeIndex })),
		};
	},
	states: {
		idle: {
			on: {
				SELECT: [{ actions: ["select", "emitChange"] }],
				MOVE: [{ actions: ["move"] }],
				ACTIVATE: [{ actions: ["activate", "emitChange"] }],
			},
		},
	},
	implementations: {
		actions: {
			select: ({ context, event }: any) => {
				context.set("selectedId", event.id);
				context.set("activeIndex", Number(event.index));
			},
			move: ({ context, event, prop }: any) => {
				const items = prop("items") as Array<{ id: string }>;
				const prev = Number(context.get("activeIndex"));
				const next = Math.max(0, Math.min(items.length - 1, prev + Number(event.delta)));
				context.set("activeIndex", next);
			},
			activate: ({ context, prop }: any) => {
				const items = prop("items") as Array<{ id: string }>;
				const index = Number(context.get("activeIndex"));
				const item = items[index];
				if (!item) return;
				context.set("selectedId", item.id);
			},
			emitChange: ({ context, prop }: any) => {
				const onSelect = prop("onSelect");
				if (typeof onSelect === "function") onSelect(String(context.get("selectedId") ?? ""));
			},
		},
	},
} as any);
