import { flowBoxConnect, flowBoxMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { For, createMemo, type JSX } from "solid-js";
import "@venner/ui/styles/flow-box.css";

interface FlowBoxProps {
	items: JSX.Element[];
}

export function FlowBox(props: FlowBoxProps) {
	const service = useMachine(flowBoxMachine, { items: props.items });
	const api = createMemo(() => flowBoxConnect(service as any));
	return <div class="venner-flow-box" {...api().rootProps}><For each={props.items}>{(item) => <div class="venner-flow-item">{item}</div>}</For></div>;
}
