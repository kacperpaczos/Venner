export function linkButtonConnect(service: any) {
	const hovered = Boolean(service.context.get("hovered"));
	const focused = Boolean(service.context.get("focused"));
	const disabled = Boolean(service.prop("disabled"));
	return {
		state: { hovered, focused, disabled },
		rootProps: {
			"data-hovered": hovered,
			"data-focused": focused,
			"data-disabled": disabled,
			onMouseEnter: () => service.send({ type: "POINTER_ENTER" }),
			onMouseLeave: () => service.send({ type: "POINTER_LEAVE" }),
			onFocus: () => service.send({ type: "FOCUS" }),
			onBlur: () => service.send({ type: "BLUR" }),
			onClick: () => service.send({ type: "CLICK" }),
		},
	};
}
