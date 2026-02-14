import { createMachine } from "@zag-js/core";

export const videoViewMachine = createMachine({
	id: "video-view",
	props({ props }: any) {
		return { src: "", onPlay: undefined, onPause: undefined, ...props };
	},
	initialState() {
		return "idle";
	},
	context({ bindable }: any) {
		return { playing: bindable(() => ({ defaultValue: false })) };
	},
	states: {
		idle: {
			on: {
				PLAY: [{ actions: ["setPlaying", "emitPlay"] }],
				PAUSE: [{ actions: ["clearPlaying", "emitPause"] }],
			},
		},
	},
	implementations: {
		actions: {
			setPlaying: ({ context }: any) => context.set("playing", true),
			clearPlaying: ({ context }: any) => context.set("playing", false),
			emitPlay: ({ prop }: any) => {
				const onPlay = prop("onPlay");
				if (typeof onPlay === "function") onPlay();
			},
			emitPause: ({ prop }: any) => {
				const onPause = prop("onPause");
				if (typeof onPause === "function") onPause();
			},
		},
	},
} as any);
