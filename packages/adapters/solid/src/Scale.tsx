import { scaleConnect, scaleMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/scale.css";

interface ScaleProps {
	value: number;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	onChange?: (value: number) => void;
}

export function Scale(props: ScaleProps) {
	const service = useMachine(scaleMachine, {
		value: props.value,
		min: props.min ?? 0,
		max: props.max ?? 100,
		step: props.step ?? 1,
		disabled: props.disabled ?? false,
		onValueChange: props.onChange,
	});
	const api = createMemo(() => scaleConnect(service as any));

	return (
		<input class="venner-scale" {...api().rootProps} />
	);
}
