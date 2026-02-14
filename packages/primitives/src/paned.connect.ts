export function panedConnect(service: any) {
	const split = Number(service.context.get("split") ?? 50);
	const min = Number(service.prop("min") ?? 15);
	const max = Number(service.prop("max") ?? 85);
	return {
		state: { split },
		handleProps: {
			type: "range" as const,
			min,
			max,
			value: split,
			onInput: (event: InputEvent) => {
				const target = event.currentTarget as HTMLInputElement;
				service.send({ type: "SET_SPLIT", split: Number(target.value) });
			},
		},
	};
}
