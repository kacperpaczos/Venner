import type { WindowTiledState } from "./types";

export type SnapZone = "none" | "top" | "left" | "right" | "top-left" | "top-right";

export interface SnapDetectionInput {
	pointerX: number;
	pointerY: number;
	viewportWidth: number;
	viewportHeight: number;
	edgeThreshold?: number;
	cornerThreshold?: number;
}

export function detectSnapZone({
	pointerX,
	pointerY,
	viewportWidth,
	viewportHeight,
	edgeThreshold = 24,
	cornerThreshold = 36,
}: SnapDetectionInput): SnapZone {
	const nearTop = pointerY <= edgeThreshold;
	const nearLeft = pointerX <= edgeThreshold;
	const nearRight = pointerX >= viewportWidth - edgeThreshold;
	const nearTopLeftCorner = pointerY <= cornerThreshold && pointerX <= cornerThreshold;
	const nearTopRightCorner =
		pointerY <= cornerThreshold && pointerX >= viewportWidth - cornerThreshold;

	if (nearTopLeftCorner) return "top-left";
	if (nearTopRightCorner) return "top-right";
	if (nearTop) return "top";
	if (nearLeft) return "left";
	if (nearRight) return "right";
	return "none";
}

export function snapZoneToTiledState(zone: SnapZone): WindowTiledState {
	switch (zone) {
		case "top":
			return "top";
		case "left":
			return "left";
		case "right":
			return "right";
		case "top-left":
			return "top-left";
		case "top-right":
			return "top-right";
		default:
			return "none";
	}
}

