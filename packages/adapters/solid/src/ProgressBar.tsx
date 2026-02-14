import { progressBarConnect, progressBarMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/progress-bar.css";

interface ProgressBarProps {
	value: number;
	max?: number;
}

export function ProgressBar(props: ProgressBarProps) {
	const service = useMachine(progressBarMachine, {
		value: props.value,
		max: props.max ?? 100,
	});
	const api = createMemo(() => progressBarConnect(service as any));

	return (
		<div class="venner-progress" role="progressbar" aria-valuemin={0} aria-valuemax={api().state.max} aria-valuenow={api().state.value}>
			<div class="venner-progress-fill" style={{ width: `${api().state.pct}%` }} />
		</div>
	);
}
