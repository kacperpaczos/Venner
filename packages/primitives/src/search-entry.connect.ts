export function searchEntryConnect(service: any) {
	const value = String(service.context.get("value") ?? "");
	const focused = Boolean(service.context.get("focused"));
	const disabled = Boolean(service.prop("disabled"));
	return {
		state: { value, focused, disabled },
		inputProps: {
			type: "search" as const,
			value,
			disabled,
			"data-focused": focused,
			onInput: (event: InputEvent) => {
				const target = event.currentTarget as HTMLInputElement;
				service.send({ type: "INPUT", value: target.value });
			},
			onFocus: () => service.send({ type: "FOCUS" }),
			onBlur: () => service.send({ type: "BLUR" }),
		},
	};
}
