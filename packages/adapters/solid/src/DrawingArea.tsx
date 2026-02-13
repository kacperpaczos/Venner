import { drawingAreaConnect, drawingAreaMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { onMount } from "solid-js";
import "@venner/ui/styles/drawing-area.css";

interface DrawingAreaProps {
	width?: number;
	height?: number;
	onRender?: () => void;
}

export function DrawingArea(props: DrawingAreaProps) {
	const service = useMachine(drawingAreaMachine, {
		width: props.width ?? 220,
		height: props.height ?? 80,
		onRender: props.onRender,
	});
	const api = () => drawingAreaConnect(service as any);
	let canvasRef!: HTMLCanvasElement;
	onMount(() => {
		const ctx = canvasRef.getContext("2d");
		if (!ctx) return;
		ctx.fillStyle = "#3584e4";
		ctx.fillRect(8, 8, 56, 32);
		ctx.fillStyle = "#ffffff";
		ctx.fillText("GTK", 24, 28);
		api().emitRendered();
	});
	return <canvas class="venner-drawing-area" {...api().rootProps} ref={canvasRef} />;
}
