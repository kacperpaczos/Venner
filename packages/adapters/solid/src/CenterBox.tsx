import { centerBoxConnect, centerBoxMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo, type JSX } from "solid-js";
import "@venner/ui/styles/center-box.css";

interface CenterBoxProps {
	start?: JSX.Element;
	center?: JSX.Element;
	end?: JSX.Element;
}

export function CenterBox(props: CenterBoxProps) {
	const service = useMachine(centerBoxMachine, {});
	const api = createMemo(() => centerBoxConnect(service as any));
	return (
		<div class="venner-center-box" {...api().rootProps}>
			<div>{props.start}</div>
			<div>{props.center}</div>
			<div>{props.end}</div>
		</div>
	);
}
