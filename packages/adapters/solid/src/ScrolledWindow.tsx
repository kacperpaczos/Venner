import type { JSX } from "solid-js";
import "@venner/ui/styles/scrolled-window.css";

interface ScrolledWindowProps {
	children?: JSX.Element;
	maxHeight?: string;
	maxWidth?: string;
}

export function ScrolledWindow(props: ScrolledWindowProps) {
	return (
		<div
			class="venner-scrolled-window"
			style={{
				"max-height": props.maxHeight ?? "320px",
				"max-width": props.maxWidth ?? "100%",
			}}
		>
			{props.children}
		</div>
	);
}
