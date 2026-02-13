import { expanderConnect, expanderMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { Show, createMemo, type JSX } from "solid-js";
import "@venner/ui/styles/expander.css";

interface ExpanderProps {
	title: string;
	expanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
	children?: JSX.Element;
}

export function Expander(props: ExpanderProps) {
	const service = useMachine(expanderMachine, {
		expanded: props.expanded ?? false,
		onExpandedChange: props.onExpandedChange,
	});
	const api = createMemo(() => expanderConnect(service as any));

	return (
		<section class="venner-expander" data-expanded={api().state.expanded}>
			<button class="venner-expander-header" {...api().headerProps}>
				{props.title}
			</button>
			<Show when={api().state.expanded}>
				<div class="venner-expander-content">{props.children}</div>
			</Show>
		</section>
	);
}
