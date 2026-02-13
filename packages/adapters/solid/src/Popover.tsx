import { popoverConnect, popoverMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { Show, createMemo, type JSX } from "solid-js";
import "@venner/ui/styles/popover.css";

interface PopoverProps {
	label?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	content: JSX.Element;
}

export function Popover(props: PopoverProps) {
	const service = useMachine(popoverMachine, {
		open: props.open ?? false,
		onOpenChange: props.onOpenChange,
	});
	const api = createMemo(() => popoverConnect(service as any));

	return (
		<div class="venner-popover-wrap" data-open={api().state.open}>
			<button class="venner-button" data-variant="default" {...api().triggerProps}>
				{props.label ?? "Open popover"}
			</button>
			<Show when={api().state.open}>
				<div class="venner-popover" role="dialog">
					{props.content}
				</div>
			</Show>
		</div>
	);
}
