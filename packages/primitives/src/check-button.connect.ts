export function checkButtonConnect(service: any) {
	const checked = Boolean(service.context.get("checked"));
	const focused = Boolean(service.context.get("focused"));
	const disabled = Boolean(service.prop("disabled"));

	return {
		state: { checked, focused, disabled },
		rootProps: {
			type: "checkbox" as const,
			checked,
			disabled,
			"data-focused": focused,
			onChange: (event: Event) => {
				const target = event.currentTarget as HTMLInputElement;
				service.send({ type: "SET_CHECKED", checked: target.checked });
			},
			onFocus: () => service.send({ type: "FOCUS" }),
			onBlur: () => service.send({ type: "BLUR" }),
		},
	};
}
