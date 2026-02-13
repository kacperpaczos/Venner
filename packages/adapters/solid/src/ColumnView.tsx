import { columnViewConnect, columnViewMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { For } from "solid-js";
import "@venner/ui/styles/column-view.css";

interface ColumnViewProps {
	columns: string[];
	rows: Record<string, string>[];
	sortBy?: string | null;
	sortDir?: "asc" | "desc";
	onSort?: (column: string, dir: string) => void;
}

export function ColumnView(props: ColumnViewProps) {
	const service = useMachine(columnViewMachine, {
		sortBy: props.sortBy ?? null,
		sortDir: props.sortDir ?? "asc",
		onSort: props.onSort,
	});
	const api = () => columnViewConnect(service as any);
	return (
		<table class="venner-column-view">
			<thead>
				<tr>{props.columns.map((col) => <th><button class="venner-column-sort" {...api().headerProps(col)}>{col}</button></th>)}</tr>
			</thead>
			<tbody>
				<For each={props.rows}>{(row) => <tr>{props.columns.map((col) => <td>{row[col] ?? ""}</td>)}</tr>}</For>
			</tbody>
		</table>
	);
}
