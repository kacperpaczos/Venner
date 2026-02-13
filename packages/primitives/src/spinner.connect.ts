export function spinnerConnect(service: any) {
	return {
		state: {
			active: Boolean(service.prop("active") ?? true),
			size: String(service.prop("size") ?? "md"),
		},
	};
}
