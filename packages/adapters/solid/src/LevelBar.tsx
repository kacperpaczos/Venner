import { levelBarConnect, levelBarMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/level-bar.css";

interface LevelBarProps {
	value: number;
	min?: number;
	max?: number;
}

export function LevelBar(props: LevelBarProps) {
	const service = useMachine(levelBarMachine, {
		value: props.value,
		min: props.min ?? 0,
		max: props.max ?? 100,
	});
	const api = createMemo(() => levelBarConnect(service as any));

	return (
		<div class="venner-level-bar" role="meter" aria-valuemin={api().state.min} aria-valuemax={api().state.max} aria-valuenow={api().state.value}>
			<div class="venner-level-fill" style={{ width: `${api().state.pct}%` }} />
		</div>
	);
}
