import { createEffect, createSignal } from "solid-js";
import "@venner/ui/styles/entry.css";

interface EntryProps {
	value?: string;
	defaultValue?: string;
	placeholder?: string;
	disabled?: boolean;
	readOnly?: boolean;
	type?: "text" | "email" | "url" | "number";
	onInput?: (value: string) => void;
	onChange?: (value: string) => void;
}

export function Entry(props: EntryProps) {
	const [localValue, setLocalValue] = createSignal(props.defaultValue ?? "");

	createEffect(() => {
		if (props.value !== undefined) {
			setLocalValue(props.value);
		}
	});

	return (
		<input
			class="venner-entry"
			type={props.type ?? "text"}
			value={props.value ?? localValue()}
			placeholder={props.placeholder}
			disabled={Boolean(props.disabled)}
			readOnly={Boolean(props.readOnly)}
			onInput={(event) => {
				const next = event.currentTarget.value;
				if (props.value === undefined) setLocalValue(next);
				props.onInput?.(next);
			}}
			onChange={(event) => {
				props.onChange?.(event.currentTarget.value);
			}}
		/>
	);
}
