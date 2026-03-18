import type { WindowBehaviorProfile, WindowRuntimeState } from "@venner/core";
import type { JSX } from "solid-js";
import { Show, createSignal } from "solid-js";
import "@venner/ui/styles/window-chrome.css";

interface WindowChromeProps {
	title?: string;
	subtitle?: string;
	profile: WindowBehaviorProfile;
	/** @deprecated use profile.chromeStyle */
	variant?: "default" | "gtk-like";
	runtimeState?: WindowRuntimeState | null;
	onMinimize?: () => void;
	onToggleMaximize?: () => void;
	onCloseRequest?: () => void;
	onStartDragging?: () => void;
	onStartResize?: () => void;
	startSlot?: JSX.Element;
	endSlot?: JSX.Element;
}

export function WindowChrome(props: WindowChromeProps) {
	const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number } | null>(null);
	const maximized = () => Boolean(props.runtimeState?.maximized);
	const focused = () => Boolean(props.runtimeState?.focused);
	const fullscreen = () => Boolean(props.runtimeState?.fullscreen);
	const variant = () => {
		if (props.profile.chromeStyle === "system-gtk") return "gtk-like";
		if (props.profile.chromeStyle === "debug-transparent") return "debug-transparent";
		return props.variant ?? "default";
	};

	return (
		<header
			class={`venner-window-chrome ${maximized() ? "is-maximized" : ""} ${fullscreen() ? "is-fullscreen" : ""} ${focused() ? "is-focused" : "is-backdrop"}`.trim()}
			data-native-decorations={props.profile.nativeDecorations}
			data-variant={variant()}
			data-focused={focused()}
			onContextMenu={(event) => {
				event.preventDefault();
				setContextMenu({ x: event.clientX, y: event.clientY });
			}}
			onMouseDown={() => setContextMenu(null)}
		>
			<button
				type="button"
				class="venner-window-drag-region"
				data-tauri-drag-region
				onMouseDown={() => props.onStartDragging?.()}
				onDblClick={() => props.onToggleMaximize?.()}
			>
				<div class="venner-window-slot">{props.startSlot}</div>
				<div class="venner-window-title-wrap">
					<strong>{props.title ?? "Window"}</strong>
					{props.subtitle ? <small>{props.subtitle}</small> : null}
				</div>
				<div class="venner-window-slot end">{props.endSlot}</div>
			</button>
			<div class="venner-window-controls" onMouseDown={(event) => event.stopPropagation()}>
				<button
					type="button"
					class="venner-window-btn icon"
					data-role="minimize"
					onMouseDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						props.onMinimize?.();
					}}
					disabled={!props.profile.allowMinimize}
					aria-label="Minimize"
					title="Minimize"
				>
					<span class="venner-window-btn__icon-carrier" aria-hidden="true">
						<span class="venner-window-btn__icon fallback-minus" />
					</span>
				</button>
				<button
					type="button"
					class="venner-window-btn icon"
					data-role="maximize"
					onMouseDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						props.onToggleMaximize?.();
					}}
					disabled={!props.profile.allowMaximize}
					aria-label={maximized() ? "Restore" : "Maximize"}
					title={maximized() ? "Restore" : "Maximize"}
				>
					<span class="venner-window-btn__icon-carrier" aria-hidden="true">
						<span class={`venner-window-btn__icon ${maximized() ? "fallback-restore" : "fallback-maximize"}`} />
					</span>
				</button>
				<button
					type="button"
					class="venner-window-btn icon danger"
					data-role="close"
					onMouseDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						props.onCloseRequest?.();
					}}
					aria-label="Close"
					title="Close"
				>
					<span class="venner-window-btn__icon-carrier" aria-hidden="true">
						<span class="venner-window-btn__icon fallback-close" />
					</span>
				</button>
			</div>
			<Show when={contextMenu()}>
				<div
					class="venner-window-context-menu"
					style={{
						left: `${contextMenu()?.x ?? 0}px`,
						top: `${contextMenu()?.y ?? 0}px`,
					}}
				>
					<button type="button" onClick={() => { props.onStartDragging?.(); setContextMenu(null); }}>Move</button>
					<button type="button" onClick={() => { props.onStartResize?.(); setContextMenu(null); }}>Resize</button>
					<button type="button" onClick={() => { props.onMinimize?.(); setContextMenu(null); }} disabled={!props.profile.allowMinimize}>Minimize</button>
					<button type="button" onClick={() => { props.onToggleMaximize?.(); setContextMenu(null); }} disabled={!props.profile.allowMaximize}>
						{maximized() ? "Restore" : "Maximize"}
					</button>
					<button type="button" class="danger" onClick={() => { props.onCloseRequest?.(); setContextMenu(null); }}>Close</button>
				</div>
			</Show>
		</header>
	);
}
