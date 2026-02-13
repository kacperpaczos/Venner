import { spinButtonConnect, spinButtonMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/spin-button.css";

interface SpinButtonProps {
	value?: number;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	onChange?: (value: number) => void;
}

export function SpinButton(props: SpinButtonProps) {
	const service = useMachine(spinButtonMachine, {
		value: props.value ?? 0,
		min: props.min ?? Number.NEGATIVE_INFINITY,
		max: props.max ?? Number.POSITIVE_INFINITY,
		step: props.step ?? 1,
		disabled: props.disabled ?? false,
		onValueChange: props.onChange,
	});
	const api = createMemo(() => spinButtonConnect(service as any));

	return (
		<div class="venner-spin-button">
			<input class="venner-entry" {...api().inputProps} />
			<div class="venner-spin-controls">
				<button {...api().incProps}>
					+
				</button>
				<button {...api().decProps}>
					-
				</button>
			</div>
		</div>
	);
}
