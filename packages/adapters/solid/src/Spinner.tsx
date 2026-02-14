import { spinnerConnect, spinnerMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/spinner.css";

interface SpinnerProps {
	active?: boolean;
	size?: "sm" | "md" | "lg";
}

export function Spinner(props: SpinnerProps) {
	const service = useMachine(spinnerMachine, {
		active: props.active ?? true,
		size: props.size ?? "md",
	});
	const api = createMemo(() => spinnerConnect(service as any));

	return (
		<div
			class="venner-spinner"
			data-active={api().state.active}
			data-size={api().state.size}
			aria-label="Loading"
			role="progressbar"
		/>
	);
}
