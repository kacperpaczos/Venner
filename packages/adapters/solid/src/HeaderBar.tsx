import { headerBarConnect, headerBarMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo, type JSX } from "solid-js";
import "@venner/ui/styles/header-bar.css";

interface HeaderBarProps {
	start?: JSX.Element;
	title: string;
	end?: JSX.Element;
}

export function HeaderBar(props: HeaderBarProps) {
	const service = useMachine(headerBarMachine, { title: props.title });
	const api = createMemo(() => headerBarConnect(service as any));

	return (
		<header class="venner-header-bar" {...api().rootProps}>
			<div>{props.start}</div>
			<h3>{props.title}</h3>
			<div>{props.end}</div>
		</header>
	);
}
