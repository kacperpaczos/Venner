export function toggleButtonConnect(service: any) {
	const pressed = Boolean(service.context.get("pressed"));
	const hovered = Boolean(service.context.get("hovered"));
	const focused = Boolean(service.context.get("focused"));
	const disabled = Boolean(service.prop("disabled"));

	return {
		state: { pressed, hovered, focused, disabled },
		rootProps: {
			type: "button" as const,
			"aria-pressed": pressed,
			"data-pressed": pressed,
			"data-hovered": hovered,
			"data-focused": focused,
			"data-disabled": disabled,
			disabled,
			onMouseEnter: () => service.send({ type: "POINTER_ENTER" }),
			onMouseLeave: () => service.send({ type: "POINTER_LEAVE" }),
			onFocus: () => service.send({ type: "FOCUS" }),
			onBlur: () => service.send({ type: "BLUR" }),
			onClick: () => service.send({ type: "TOGGLE" }),
		},
	};
}
