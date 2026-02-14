export interface Adjustment {
	value: number;
	lower: number;
	upper: number;
	stepIncrement?: number;
	pageIncrement?: number;
	pageSize?: number;
}

export function clampAdjustment(input: Adjustment): number {
	return Math.max(input.lower, Math.min(input.upper, input.value));
}

export function stepAdjustment(input: Adjustment, direction: 1 | -1): number {
	const step = input.stepIncrement ?? 1;
	return clampAdjustment({ ...input, value: input.value + direction * step });
}
