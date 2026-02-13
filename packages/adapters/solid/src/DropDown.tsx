import { dropdownConnect, dropdownMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/dropdown.css";

interface DropDownProps {
	items: { id: string; label: string }[];
	value?: string;
	onChange?: (value: string) => void;
}

export function DropDown(props: DropDownProps) {
	const service = useMachine(dropdownMachine, {
		value: props.value ?? "",
		onChange: props.onChange,
	});
	const api = createMemo(() => dropdownConnect(service as any));

	return (
		<select class="venner-dropdown" {...api().rootProps}>
			{props.items.map((item) => (
				<option value={item.id}>{item.label}</option>
			))}
		</select>
	);
}
