export function headerBarConnect(service: any) {
	return {
		state: { title: String(service.prop("title") ?? "") },
		rootProps: { role: "banner" as const },
	};
}
