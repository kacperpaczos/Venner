export function spinButtonConnect(service: any) {
	const value = Number(service.context.get("value") ?? 0);
	const disabled = Boolean(service.prop("disabled"));
	const min = Number(service.prop("min"));
	const max = Number(service.prop("max"));
	const step = Number(service.prop("step"));
	return {
		state: { value, disabled },
		inputProps: {
			type: "number" as const,
			value,
			min: Number.isFinite(min) ? min : undefined,
			max: Number.isFinite(max) ? max : undefined,
			step,
			disabled,
			onInput: (event: InputEvent) => {
				const target = event.currentTarget as HTMLInputElement;
				service.send({ type: "SET_VALUE", value: Number(target.value) });
			},
		},
		incProps: { type: "button" as const, disabled, onClick: () => service.send({ type: "INCREMENT" }) },
		decProps: { type: "button" as const, disabled, onClick: () => service.send({ type: "DECREMENT" }) },
	};
}
