import type { JSX } from "solid-js";
import "@venner/ui/styles/application-window.css";

interface ApplicationWindowProps {
	title?: string;
	subtitle?: string;
	children?: JSX.Element;
	startSlot?: JSX.Element;
	endSlot?: JSX.Element;
}

export function ApplicationWindow(props: ApplicationWindowProps) {
	return (
		<section class="venner-application-window" role="application" aria-label={props.title ?? "Application window"}>
			<header class="venner-application-window-header">
				<div class="venner-application-window-slot">{props.startSlot}</div>
				<div class="venner-application-window-title-wrap">
					<strong>{props.title ?? "Window"}</strong>
					{props.subtitle ? <small>{props.subtitle}</small> : null}
				</div>
				<div class="venner-application-window-slot end">{props.endSlot}</div>
			</header>
			<div class="venner-application-window-content">{props.children}</div>
		</section>
	);
}
