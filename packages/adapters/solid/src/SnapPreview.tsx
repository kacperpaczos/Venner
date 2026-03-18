import type { SnapZone } from "@venner/core";

interface SnapPreviewProps {
	zone: SnapZone;
}

export function SnapPreview(props: SnapPreviewProps) {
	if (props.zone === "none") return null;
	return <div class={`venner-snap-preview zone-${props.zone}`} aria-hidden="true" />;
}

