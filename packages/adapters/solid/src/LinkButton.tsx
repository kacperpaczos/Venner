import { linkButtonConnect, linkButtonMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/link-button.css";

interface LinkButtonProps {
	href: string;
	children?: string;
	disabled?: boolean;
	onClick?: () => void;
}

export function LinkButton(props: LinkButtonProps) {
	const service = useMachine(linkButtonMachine, {
		disabled: props.disabled ?? false,
		onNavigate: props.onClick,
	});
	const api = createMemo(() => linkButtonConnect(service as any));

	return (
		<a
			class="venner-link-button"
			href={props.disabled ? undefined : props.href}
			target="_blank"
			rel="noreferrer"
			onClick={(e) => {
				if (props.disabled) {
					e.preventDefault();
					return;
				}
				api().rootProps.onClick();
			}}
			onMouseEnter={api().rootProps.onMouseEnter}
			onMouseLeave={api().rootProps.onMouseLeave}
			onFocus={api().rootProps.onFocus}
			onBlur={api().rootProps.onBlur}
			data-hovered={api().state.hovered}
			data-focused={api().state.focused}
			data-disabled={api().state.disabled}
		>
			{props.children}
		</a>
	);
}
