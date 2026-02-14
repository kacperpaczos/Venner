export function popoverConnect(service: any) {
	const open = Boolean(service.context.get("open"));
	return {
		state: { open },
		triggerProps: {
			type: "button" as const,
			"aria-expanded": open,
			onClick: () => service.send({ type: "TOGGLE" }),
		},
	};
}
