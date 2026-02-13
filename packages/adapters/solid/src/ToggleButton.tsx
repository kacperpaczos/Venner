import { toggleButtonConnect, toggleButtonMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/toggle-button.css";

interface ToggleButtonProps {
	pressed?: boolean;
	disabled?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	children?: string;
}

export function ToggleButton(props: ToggleButtonProps) {
	const service = useMachine(toggleButtonMachine, {
		pressed: props.pressed ?? false,
		disabled: props.disabled ?? false,
		onPressedChange: props.onPressedChange,
	});
	const api = createMemo(() => toggleButtonConnect(service as any));

	return (
		<button
			class="venner-toggle-button"
			{...api().rootProps}
		>
			{props.children}
		</button>
	);
}
