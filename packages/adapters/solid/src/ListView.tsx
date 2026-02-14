import { listViewConnect, listViewMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { For, createEffect, createSignal } from "solid-js";
import "@venner/ui/styles/list-view.css";

export interface ListViewItem {
	id: string;
	label: string;
	description?: string;
}

interface ListViewProps {
	items: ListViewItem[];
	selectedId?: string | null;
	onSelect?: (id: string) => void;
}

export function ListView(props: ListViewProps) {
	const service = useMachine(listViewMachine, {
		items: props.items,
		selectedId: props.selectedId ?? null,
		onSelect: props.onSelect,
	});
	const api = () => listViewConnect(service as any);
	const [activeIndex, setActiveIndex] = createSignal(0);

	createEffect(() => {
		if (!props.selectedId) return;
		const idx = props.items.findIndex((item) => item.id === props.selectedId);
		if (idx >= 0) setActiveIndex(idx);
	});

	const selectIndex = (index: number) => {
		if (index < 0 || index >= props.items.length) return;
		setActiveIndex(index);
		props.onSelect?.(props.items[index].id);
	};

	return (
		<div
			class="venner-list-view"
			{...api().rootProps}
			onKeyDown={(e) => {
				api().rootProps.onKeyDown(e);
				if (e.key === "ArrowDown") {
					e.preventDefault();
					selectIndex(Math.min(props.items.length - 1, activeIndex() + 1));
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					selectIndex(Math.max(0, activeIndex() - 1));
				}
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					selectIndex(activeIndex());
				}
			}}
		>
			<For each={props.items}>
				{(item, index) => {
					const selected = () => item.id === props.selectedId;
					return (
						<button
							type="button"
							class="venner-list-row"
							role="option"
							aria-selected={selected()}
							data-selected={selected()}
							onClick={() => selectIndex(index())}
						>
							<span>{item.label}</span>
							{item.description ? <small>{item.description}</small> : null}
						</button>
					);
				}}
			</For>
		</div>
	);
}
