export function columnViewConnect(service: any) {
	const sortBy = String(service.context.get("sortBy") ?? "");
	const sortDir = String(service.context.get("sortDir") ?? "asc");
	return {
		state: { sortBy, sortDir },
		headerProps: (column: string) => ({
			type: "button" as const,
			"data-sorted": column === sortBy,
			"data-sort-dir": column === sortBy ? sortDir : "none",
			onClick: () => service.send({ type: "SORT", column }),
		}),
	};
}
