export function gridViewConnect(service: any) {
	const selectedId = String(service.context.get("selectedId") ?? "");
	return {
		state: { selectedId },
		itemProps: (id: string) => ({
			"data-selected": id === selectedId,
			onClick: () => service.send({ type: "SELECT", id }),
		}),
	};
}
