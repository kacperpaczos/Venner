export function levelBarConnect(service: any) {
	const value = Number(service.prop("value") ?? service.context.get("value") ?? 0);
	const min = Number(service.prop("min") ?? 0);
	const max = Number(service.prop("max") ?? 100);
	const span = max - min;
	const pct = span <= 0 ? 0 : Math.max(0, Math.min(100, ((value - min) / span) * 100));
	return { state: { value, min, max, pct } };
}
