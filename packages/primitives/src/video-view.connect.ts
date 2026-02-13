export function videoViewConnect(service: any) {
	const src = String(service.prop("src") ?? "");
	const playing = Boolean(service.context.get("playing"));
	return {
		state: { src, playing },
		rootProps: {
			src,
			onPlay: () => service.send({ type: "PLAY" }),
			onPause: () => service.send({ type: "PAUSE" }),
		},
	};
}
