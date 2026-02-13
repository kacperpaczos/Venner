import { panedConnect, panedMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/paned.css";
import type { JSX } from "solid-js";

interface PanedProps {
	split?: number;
	onSplitChange?: (split: number) => void;
	start: JSX.Element;
	end: JSX.Element;
}

export function Paned(props: PanedProps) {
	const service = useMachine(panedMachine, {
		split: props.split ?? 50,
		onSplitChange: props.onSplitChange,
	});
	const api = createMemo(() => panedConnect(service as any));

	return (
		<div class="venner-paned" style={{ "grid-template-columns": `${api().state.split}% 8px 1fr` }}>
			<div class="venner-pane">{props.start}</div>
			<input class="venner-paned-handle" aria-label="Adjust split" {...api().handleProps} />
			<div class="venner-pane">{props.end}</div>
		</div>
	);
}
