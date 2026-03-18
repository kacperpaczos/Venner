import {
	detectSnapZone,
	type SnapZone,
	type WindowBehaviorProfile,
	type WindowRuntimeState,
	type WindowTiledState,
} from "@venner/core";
import { createMemo, createSignal, type JSX } from "solid-js";
import "@venner/ui/styles/application-window.css";
import { useWindowZoom } from "./hooks/useWindowZoom";
import { SnapPreview } from "./SnapPreview";
import { WindowChrome } from "./WindowChrome";

type ResizeDirection =
	| "North"
	| "South"
	| "East"
	| "West"
	| "NorthEast"
	| "NorthWest"
	| "SouthEast"
	| "SouthWest";

interface ApplicationWindowProps {
	windowId?: string;
	title?: string;
	subtitle?: string;
	children?: JSX.Element;
	startSlot?: JSX.Element;
	endSlot?: JSX.Element;
	tiled?: WindowTiledState;
	chromeMode?: "native" | "custom";
	profile?: WindowBehaviorProfile;
	runtimeState?: WindowRuntimeState | null;
	enableZoom?: boolean;
	showZoomIndicator?: boolean;
	enableSnapPreview?: boolean;
	/** @deprecated use profile.chromeStyle */
	chromeVariant?: "default" | "gtk-like";
	onMinimize?: () => void;
	onToggleMaximize?: () => void;
	onCloseRequest?: () => void;
	onStartDragging?: () => void;
	onStartResize?: (direction: ResizeDirection) => void;
}

export function ApplicationWindow(props: ApplicationWindowProps) {
	const [snapZone, setSnapZone] = createSignal<SnapZone>("none");
	const windowId = () => props.windowId ?? "main";
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
	const zoom = useWindowZoom({ windowId: windowId() });
	const tiled = createMemo(() => props.tiled ?? props.runtimeState?.tiled ?? "none");
	const contentStyle = createMemo(() =>
		props.enableZoom === false
			? undefined
			: {
					...zoom.contentStyle(),
					transition: "transform var(--venner-transition-medium, 250ms) ease",
			  },
	);
	const isCustom = () => props.chromeMode === "custom";
	const showResizeHandles = () => isCustom() && profile().resizable && !profile().nativeDecorations;
	const showSnapPreview = () => props.enableSnapPreview !== false && isCustom() && snapZone() !== "none";
	const showZoomIndicator = () => props.showZoomIndicator !== false && props.enableZoom !== false;

	const onPointerMove: JSX.EventHandlerUnion<HTMLElement, PointerEvent> = (event) => {
		if (!props.enableSnapPreview || !showResizeHandles()) return;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		setSnapZone(
			detectSnapZone({
				pointerX: event.clientX,
				pointerY: event.clientY,
				viewportWidth,
				viewportHeight,
			}),
		);
	};

	return (
		<section
			class="venner-application-window"
			role="application"
			aria-label={props.title ?? "Application window"}
			data-maximized={Boolean(props.runtimeState?.maximized)}
			data-focused={Boolean(props.runtimeState?.focused)}
			data-fullscreen={Boolean(props.runtimeState?.fullscreen)}
			data-tiled={tiled()}
			onPointerMove={onPointerMove}
			onPointerLeave={() => setSnapZone("none")}
		>
			{showResizeHandles() ? (
				<>
					<button type="button" class="venner-resize-handle n" aria-label="Resize north" onMouseDown={() => props.onStartResize?.("North")} />
					<button type="button" class="venner-resize-handle s" aria-label="Resize south" onMouseDown={() => props.onStartResize?.("South")} />
					<button type="button" class="venner-resize-handle e" aria-label="Resize east" onMouseDown={() => props.onStartResize?.("East")} />
					<button type="button" class="venner-resize-handle w" aria-label="Resize west" onMouseDown={() => props.onStartResize?.("West")} />
					<button type="button" class="venner-resize-handle ne" aria-label="Resize north-east" onMouseDown={() => props.onStartResize?.("NorthEast")} />
					<button type="button" class="venner-resize-handle nw" aria-label="Resize north-west" onMouseDown={() => props.onStartResize?.("NorthWest")} />
					<button type="button" class="venner-resize-handle se" aria-label="Resize south-east" onMouseDown={() => props.onStartResize?.("SouthEast")} />
					<button type="button" class="venner-resize-handle sw" aria-label="Resize south-west" onMouseDown={() => props.onStartResize?.("SouthWest")} />
				</>
			) : null}
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
					onStartResize={() => props.onStartResize?.("SouthEast")}
					startSlot={props.startSlot}
					endSlot={
						<>
							{props.endSlot}
							{showZoomIndicator() ? (
								<div class="venner-window-zoom-indicator" role="group" aria-label="Window zoom controls">
									<button type="button" onClick={() => void zoom.zoomOut()}>-</button>
									<button type="button" class="value" onClick={() => void zoom.resetZoom()}>
										{Math.round(zoom.zoom() * 100)}%
									</button>
									<button type="button" onClick={() => void zoom.zoomIn()}>+</button>
								</div>
							) : null}
						</>
					}
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
			<div class="venner-application-window-content" style={contentStyle()}>
				{props.children}
			</div>
			{showSnapPreview() ? <SnapPreview zone={snapZone()} /> : null}
		</section>
	);
}
