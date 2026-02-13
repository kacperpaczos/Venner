import { videoViewConnect, videoViewMachine } from "@venner/primitives";
import { useMachine } from "@zag-js/solid";
import { createMemo } from "solid-js";
import "@venner/ui/styles/video-view.css";

interface VideoViewProps {
	src: string;
	onPlay?: () => void;
	onPause?: () => void;
}

export function VideoView(props: VideoViewProps) {
	const service = useMachine(videoViewMachine, {
		src: props.src,
		onPlay: props.onPlay,
		onPause: props.onPause,
	});
	const api = createMemo(() => videoViewConnect(service as any));
	return <video class="venner-video-view" controls {...api().rootProps} />;
}
