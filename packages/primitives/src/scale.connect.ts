export function scaleConnect(service: any) {
	const value = Number(service.context.get("value") ?? 0);
	const min = Number(service.prop("min") ?? 0);
	const max = Number(service.prop("max") ?? 100);
	const step = Number(service.prop("step") ?? 1);
	const disabled = Boolean(service.prop("disabled"));

	return {
		state: { value, min, max, step, disabled },
		rootProps: {
			type: "range" as const,
			value,
			min,
			max,
			step,
			disabled,
			onInput: (event: InputEvent) => {
				const target = event.currentTarget as HTMLInputElement;
				service.send({ type: "SET_VALUE", value: Number(target.value) });
			},
		},
	};
}
