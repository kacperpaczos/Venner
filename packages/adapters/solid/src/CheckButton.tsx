import { checkButtonConnect, checkButtonMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/check-button.css";

interface CheckButtonProps {
	checked?: boolean;
	disabled?: boolean;
	label?: string;
	onChange?: (checked: boolean) => void;
}

export function CheckButton(props: CheckButtonProps) {
	const service = useMachine(checkButtonMachine, {
		checked: props.checked ?? false,
		disabled: props.disabled ?? false,
		onCheckedChange: props.onChange,
	});
	const api = createMemo(() => checkButtonConnect(service as any));

	return (
		<label class="venner-check-button" data-disabled={Boolean(props.disabled)}>
			<input {...api().rootProps} />
			<span>{props.label ?? "Check"}</span>
		</label>
	);
}
