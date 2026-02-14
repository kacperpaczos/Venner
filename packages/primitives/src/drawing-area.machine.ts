import { createMachine } from "@zag-js/core";

export const drawingAreaMachine = createMachine({
	id: "drawing-area",
	props({ props }: any) {
		return { width: 220, height: 80, onRender: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	states: {
		idle: {
			on: {
				RENDERED: [{ actions: ["emitRender"] }],
			},
		},
	},
	implementations: {
		actions: {
			emitRender: ({ prop }: any) => {
				const onRender = prop("onRender");
				if (typeof onRender === "function") onRender();
			},
		},
	},
} as any);
