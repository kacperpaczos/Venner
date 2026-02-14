import type { JSX } from "solid-js";
import "@venner/ui/styles/grid.css";

interface GridProps {
	children?: JSX.Element;
	columns?: string;
	rows?: string;
	gap?: string;
}

export function Grid(props: GridProps) {
	return (
		<div
			class="venner-grid"
			style={{
				"grid-template-columns": props.columns ?? "repeat(2, minmax(0, 1fr))",
				"grid-template-rows": props.rows ?? "auto",
				gap: props.gap ?? "8px",
			}}
		>
			{props.children}
		</div>
	);
}
