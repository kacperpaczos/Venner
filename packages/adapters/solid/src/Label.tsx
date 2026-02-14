import type { JSX } from "solid-js";
import "@venner/ui/styles/label.css";

interface LabelProps {
	children?: JSX.Element;
	muted?: boolean;
	strong?: boolean;
	htmlFor?: string;
}

export function Label(props: LabelProps) {
	return (
		<label
			class="venner-label"
			data-muted={Boolean(props.muted)}
			data-strong={Boolean(props.strong)}
			for={props.htmlFor}
		>
			{props.children}
		</label>
	);
}
