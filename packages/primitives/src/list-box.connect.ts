export function listBoxConnect(service: any) {
	const activeId = String(service.context.get("activeId") ?? "");
	return {
		state: { activeId },
		rootProps: { role: "listbox" as const },
		itemProps: (id: string) => ({
			type: "button" as const,
			"data-active": id === activeId,
			onClick: () => service.send({ type: "SELECT", id }),
		}),
	};
}
