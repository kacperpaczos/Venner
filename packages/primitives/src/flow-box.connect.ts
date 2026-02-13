export function flowBoxConnect(service: any) {
	const items = (service.prop("items") as unknown[]) ?? [];
	return {
		state: { count: items.length },
		rootProps: { role: "group" as const, "data-count": items.length },
	};
}
