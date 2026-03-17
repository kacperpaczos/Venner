import type { JSX } from "solid-js";
import type { WindowBehaviorProfile, WindowRuntimeState } from "@venner/core";
import "@venner/ui/styles/application-window.css";
import { WindowChrome } from "./WindowChrome";

interface ApplicationWindowProps {
	title?: string;
	subtitle?: string;
	children?: JSX.Element;
	startSlot?: JSX.Element;
	endSlot?: JSX.Element;
	chromeMode?: "native" | "custom";
	profile?: WindowBehaviorProfile;
	runtimeState?: WindowRuntimeState | null;
	/** @deprecated use profile.chromeStyle */
	chromeVariant?: "default" | "gtk-like";
	onMinimize?: () => void;
	onToggleMaximize?: () => void;
	onCloseRequest?: () => void;
	onStartDragging?: () => void;
}

export function ApplicationWindow(props: ApplicationWindowProps) {
	const profile = (): WindowBehaviorProfile => props.profile ?? {
		id: "default",
		nativeDecorations: false,
		chromeStyle: "system-gtk",
		resizable: true,
		allowMinimize: true,
		allowMaximize: true,
		allowFullscreen: true,
		themeMode: "system-follow",
	};

	return (
		<section class="venner-application-window" role="application" aria-label={props.title ?? "Application window"}>
			{props.chromeMode === "custom" ? (
				<WindowChrome
					title={props.title}
					subtitle={props.subtitle}
					profile={profile()}
					variant={props.chromeVariant}
					runtimeState={props.runtimeState}
					onMinimize={props.onMinimize}
					onToggleMaximize={props.onToggleMaximize}
					onCloseRequest={props.onCloseRequest}
					onStartDragging={props.onStartDragging}
					startSlot={props.startSlot}
					endSlot={props.endSlot}
				/>
			) : (
				<header class="venner-application-window-header">
					<div class="venner-application-window-slot">{props.startSlot}</div>
					<div class="venner-application-window-title-wrap">
						<strong>{props.title ?? "Window"}</strong>
						{props.subtitle ? <small>{props.subtitle}</small> : null}
					</div>
					<div class="venner-application-window-slot end">{props.endSlot}</div>
				</header>
			)}
			<div class="venner-application-window-content">{props.children}</div>
		</section>
	);
}
