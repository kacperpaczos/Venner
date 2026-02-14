export function expanderConnect(service: any) {
	const expanded = Boolean(service.context.get("expanded"));
	return {
		state: { expanded },
		headerProps: {
			type: "button" as const,
			"aria-expanded": expanded,
			onClick: () => service.send({ type: "TOGGLE" }),
		},
	};
}
