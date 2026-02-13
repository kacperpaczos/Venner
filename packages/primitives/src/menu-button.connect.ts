export function menuButtonConnect(service: any) {
	const open = Boolean(service.context.get("open"));
	const disabled = Boolean(service.prop("disabled"));

	return {
		state: { open, disabled },
		triggerProps: {
			type: "button" as const,
			disabled,
			"aria-expanded": open,
			"data-open": open,
			onClick: () => service.send({ type: "TOGGLE" }),
		},
	};
}
