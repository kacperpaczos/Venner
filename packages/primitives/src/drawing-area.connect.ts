export function drawingAreaConnect(service: any) {
	const width = Number(service.prop("width") ?? 220);
	const height = Number(service.prop("height") ?? 80);
	return {
		state: { width, height },
		rootProps: { width, height },
		emitRendered: () => service.send({ type: "RENDERED" }),
	};
}
