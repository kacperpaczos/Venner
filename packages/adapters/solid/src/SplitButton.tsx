import { splitButtonConnect, splitButtonMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/split-button.css";

interface SplitButtonProps {
	label: string;
	onPrimary?: () => void;
	onMenu?: () => void;
}

export function SplitButton(props: SplitButtonProps) {
	const service = useMachine(splitButtonMachine, {
		onPrimary: props.onPrimary,
		onMenu: props.onMenu,
	});
	const api = createMemo(() => splitButtonConnect(service as any));

	return (
		<div class="venner-split-button">
			<button {...api().primaryProps}>{props.label}</button>
			<button class="venner-split-menu" {...api().menuProps}>▾</button>
		</div>
	);
}
