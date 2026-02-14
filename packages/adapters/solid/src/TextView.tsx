import { textViewConnect, textViewMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/text-view.css";

interface TextViewProps {
	value?: string;
	onInput?: (value: string) => void;
}

export function TextView(props: TextViewProps) {
	const service = useMachine(textViewMachine, {
		value: props.value ?? "",
		onInput: props.onInput,
	});
	const api = createMemo(() => textViewConnect(service as any));
	return <textarea class="venner-text-view" {...api().rootProps} />;
}
