export function listViewConnect(service: any) {
	const selectedId = (service.context.get("selectedId") as string | null) ?? null;
	const activeIndex = Number(service.context.get("activeIndex") ?? 0);
	return {
		state: { selectedId, activeIndex },
		rootProps: {
			role: "listbox" as const,
			tabIndex: 0,
			onKeyDown: (event: KeyboardEvent) => {
				if (event.key === "ArrowDown") {
					event.preventDefault();
					service.send({ type: "MOVE", delta: 1 });
				}
				if (event.key === "ArrowUp") {
					event.preventDefault();
					service.send({ type: "MOVE", delta: -1 });
				}
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					service.send({ type: "ACTIVATE" });
				}
			},
		},
	};
}
