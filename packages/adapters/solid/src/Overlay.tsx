import type { JSX } from "solid-js";
import "@venner/ui/styles/overlay.css";

interface OverlayProps {
	children?: JSX.Element;
	overlay?: JSX.Element;
	position?: "top-start" | "top-end" | "bottom-start" | "bottom-end" | "center";
}

const POSITION_CLASS: Record<NonNullable<OverlayProps["position"]>, string> = {
	"top-start": "top-start",
	"top-end": "top-end",
	"bottom-start": "bottom-start",
	"bottom-end": "bottom-end",
	center: "center",
};

export function Overlay(props: OverlayProps) {
	const position = () => POSITION_CLASS[props.position ?? "top-end"];
	return (
		<div class="venner-overlay">
			<div class="venner-overlay-base">{props.children}</div>
			<div class={`venner-overlay-layer ${position()}`}>{props.overlay}</div>
		</div>
	);
}
