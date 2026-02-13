import { actionBarConnect, actionBarMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo, type JSX } from "solid-js";
import "@venner/ui/styles/action-bar.css";

interface ActionBarProps {
	children?: JSX.Element;
}

export function ActionBar(props: ActionBarProps) {
	const service = useMachine(actionBarMachine, {});
	const api = createMemo(() => actionBarConnect(service as any));
	return <footer class="venner-action-bar" {...api().rootProps}>{props.children}</footer>;
}
