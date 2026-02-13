import { passwordEntryConnect, passwordEntryMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/password-entry.css";

interface PasswordEntryProps {
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	onInput?: (value: string) => void;
}

export function PasswordEntry(props: PasswordEntryProps) {
	const service = useMachine(passwordEntryMachine, {
		value: props.value ?? "",
		disabled: props.disabled ?? false,
		onValueChange: props.onInput,
	});
	const api = createMemo(() => passwordEntryConnect(service as any));

	return (
		<div class="venner-password-entry">
			<input
				class="venner-entry"
				placeholder={props.placeholder ?? "Password"}
				{...api().inputProps}
			/>
			<button
				class="venner-password-toggle"
				{...api().toggleProps}
			>
				{api().state.revealed ? "Hide" : "Show"}
			</button>
		</div>
	);
}
