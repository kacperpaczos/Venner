import { buttonConnect, buttonMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/button.css";

interface ButtonProps {
	children?: string;
	variant?: "default" | "suggested" | "destructive" | "secondary" | "ghost" | "link";
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
	onClick?: () => void;
}

export function Button(props: ButtonProps) {
	const service = useMachine(buttonMachine, {
		disabled: props.disabled ?? false,
		variant: props.variant ?? "default",
		size: props.size ?? "md",
		onClick: props.onClick,
	});
	const api = createMemo(() => buttonConnect(service as any));

	return (
		<button
			class="venner-button"
			{...api().rootProps}
		>
			{props.children}
		</button>
	);
}
