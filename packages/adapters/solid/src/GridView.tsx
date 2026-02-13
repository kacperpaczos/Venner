import { gridViewConnect, gridViewMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { For } from "solid-js";
import "@venner/ui/styles/grid-view.css";

interface GridViewProps {
	items: { id: string; label: string }[];
	selectedId?: string | null;
	onSelect?: (id: string) => void;
}

export function GridView(props: GridViewProps) {
	const service = useMachine(gridViewMachine, {
		selectedId: props.selectedId ?? null,
		onSelect: props.onSelect,
	});
	const api = () => gridViewConnect(service as any);
	return <div class="venner-grid-view"><For each={props.items}>{(item) => <button type="button" class="venner-grid-card" {...api().itemProps(item.id)}>{item.label}</button>}</For></div>;
}
