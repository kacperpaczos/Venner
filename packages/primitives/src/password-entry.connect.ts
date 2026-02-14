export function passwordEntryConnect(service: any) {
	const value = String(service.context.get("value") ?? "");
	const revealed = Boolean(service.context.get("revealed"));
	const disabled = Boolean(service.prop("disabled"));
	return {
		state: { value, revealed, disabled },
		inputProps: {
			type: revealed ? ("text" as const) : ("password" as const),
			value,
			disabled,
			onInput: (event: InputEvent) => {
				const target = event.currentTarget as HTMLInputElement;
				service.send({ type: "INPUT", value: target.value });
			},
		},
		toggleProps: {
			type: "button" as const,
			disabled,
			onClick: () => service.send({ type: "TOGGLE_REVEAL" }),
		},
	};
}
