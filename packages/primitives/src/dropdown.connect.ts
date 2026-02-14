export function dropdownConnect(service: any) {
	const value = String(service.context.get("value") ?? "");
	const open = Boolean(service.context.get("open"));
	const focused = Boolean(service.context.get("focused"));
	const disabled = Boolean(service.prop("disabled"));
	return {
		state: { value, open, focused, disabled },
		rootProps: {
			value,
			disabled,
			"data-open": open,
			"data-focused": focused,
			onChange: (event: Event) => {
				const target = event.currentTarget as HTMLSelectElement;
				service.send({ type: "SET_VALUE", value: target.value });
			},
			onFocus: () => service.send({ type: "FOCUS" }),
			onBlur: () => service.send({ type: "BLUR" }),
			onClick: () => service.send({ type: "SET_OPEN", open: true }),
		},
	};
}
