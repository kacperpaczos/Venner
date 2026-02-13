import { searchEntryConnect, searchEntryMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/search-entry.css";

interface SearchEntryProps {
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	onInput?: (value: string) => void;
}

export function SearchEntry(props: SearchEntryProps) {
	const service = useMachine(searchEntryMachine, {
		value: props.value ?? "",
		disabled: props.disabled ?? false,
		onValueChange: props.onInput,
	});
	const api = createMemo(() => searchEntryConnect(service as any));

	return (
		<label class="venner-search-entry">
			<span aria-hidden="true">Search</span>
			<input
				class="venner-entry"
				placeholder={props.placeholder ?? "Search"}
				{...api().inputProps}
			/>
		</label>
	);
}
