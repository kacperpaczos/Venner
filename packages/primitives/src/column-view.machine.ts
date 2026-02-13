import { createMachine } from "@zag-js/core";

export const columnViewMachine = createMachine({
	id: "column-view",
	props({ props }: any) {
		return { sortBy: null, sortDir: "asc", onSort: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable, prop }: any) {
		return {
			sortBy: bindable(() => ({ defaultValue: prop("sortBy") ?? null })),
			sortDir: bindable(() => ({ defaultValue: String(prop("sortDir") ?? "asc") })),
		};
	},
	states: {
		idle: {
			on: {
				SORT: [{ actions: ["sort", "emitSort"] }],
			},
		},
	},
	implementations: {
		actions: {
			sort: ({ context, event }: any) => {
				const nextBy = String(event.column ?? "");
				const prevBy = String(context.get("sortBy") ?? "");
				const prevDir = String(context.get("sortDir") ?? "asc");
				const nextDir = prevBy === nextBy && prevDir === "asc" ? "desc" : "asc";
				context.set("sortBy", nextBy);
				context.set("sortDir", nextDir);
			},
			emitSort: ({ context, prop }: any) => {
				const onSort = prop("onSort");
				if (typeof onSort === "function") onSort(String(context.get("sortBy") ?? ""), String(context.get("sortDir") ?? "asc"));
			},
		},
	},
} as any);
