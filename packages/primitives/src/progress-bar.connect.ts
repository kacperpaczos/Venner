export function progressBarConnect(service: any) {
	const value = Number(service.prop("value") ?? service.context.get("value") ?? 0);
	const max = Number(service.prop("max") ?? 100);
	const pct = Math.max(0, Math.min(100, (value / max) * 100));
	return { state: { value, max, pct } };
}
