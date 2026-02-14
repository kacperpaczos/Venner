import type { JSX } from "solid-js";
import "@venner/ui/styles/widget.css";

interface WidgetProps {
	children?: JSX.Element;
	role?: string;
	disabled?: boolean;
	focused?: boolean;
	selected?: boolean;
	class?: string;
}

export function Widget(props: WidgetProps) {
	return (
		<div
			class={`venner-widget ${props.class ?? ""}`.trim()}
			role={props.role}
			aria-disabled={props.disabled ? "true" : undefined}
			data-disabled={Boolean(props.disabled)}
			data-focused={Boolean(props.focused)}
			data-selected={Boolean(props.selected)}
		>
			{props.children}
		</div>
	);
}
