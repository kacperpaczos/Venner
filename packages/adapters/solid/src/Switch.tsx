import { createSignal } from "solid-js";
import "@venner/ui/styles/switch.css";

interface SwitchProps {
	checked?: boolean;
	disabled?: boolean;
	onChange?: (checked: boolean) => void;
}

export function Switch(props: SwitchProps) {
	const [checked, setChecked] = createSignal(Boolean(props.checked));

	const toggle = () => {
		if (props.disabled) return;
		const next = !checked();
		setChecked(next);
		props.onChange?.(next);
	};

	return (
		<button
			type="button"
			class="venner-switch"
			role="switch"
			aria-checked={checked()}
			data-checked={checked()}
			data-disabled={Boolean(props.disabled)}
			disabled={Boolean(props.disabled)}
			onClick={toggle}
		>
			<span class="venner-switch-thumb" />
		</button>
	);
}
