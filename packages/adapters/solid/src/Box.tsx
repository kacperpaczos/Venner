import type { JSX } from "solid-js";
import "@venner/ui/styles/box.css";

interface BoxProps {
	children?: JSX.Element;
	orientation?: "horizontal" | "vertical";
	spacing?: string;
	align?: "start" | "center" | "end" | "stretch";
}

export function Box(props: BoxProps) {
	return (
		<div
			class="venner-box"
			data-orientation={props.orientation ?? "vertical"}
			data-align={props.align ?? "stretch"}
			style={{ gap: props.spacing ?? "8px" }}
		>
			{props.children}
		</div>
	);
}
