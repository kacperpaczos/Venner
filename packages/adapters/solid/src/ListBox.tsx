import { listBoxConnect, listBoxMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { For } from "solid-js";
import "@venner/ui/styles/list-box.css";

interface ListBoxProps {
	items: { id: string; label: string }[];
	activeId?: string;
	onChange?: (id: string) => void;
}

export function ListBox(props: ListBoxProps) {
	const service = useMachine(listBoxMachine, {
		items: props.items,
		activeId: props.activeId ?? null,
		onChange: props.onChange,
	});
	const api = () => listBoxConnect(service as any);

	return (
		<div class="venner-list-box" {...api().rootProps}>
			<For each={props.items}>
				{(item) => (
					<button class="venner-list-box-row" {...api().itemProps(item.id)}>
						{item.label}
					</button>
				)}
			</For>
		</div>
	);
}
