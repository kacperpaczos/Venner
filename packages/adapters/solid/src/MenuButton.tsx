import { menuButtonConnect, menuButtonMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { Show, createMemo, type JSX } from "solid-js";
import "@venner/ui/styles/menu-button.css";

interface MenuButtonProps {
	label?: string;
	open?: boolean;
	disabled?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: JSX.Element;
}

export function MenuButton(props: MenuButtonProps) {
	const service = useMachine(menuButtonMachine, {
		open: props.open ?? false,
		disabled: props.disabled ?? false,
		onOpenChange: props.onOpenChange,
	});
	const api = createMemo(() => menuButtonConnect(service as any));

	return (
		<div class="venner-menu-button-wrap" data-open={api().state.open}>
			<button
				class="venner-menu-button"
				{...api().triggerProps}
			>
				{props.label ?? "Menu"}
			</button>
			<Show when={api().state.open}>
				<div class="venner-menu-content" role="menu">
					{props.children}
				</div>
			</Show>
		</div>
	);
}
