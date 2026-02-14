import { createMemo } from "solid-js";
import "@venner/ui/styles/media-controls.css";

interface MediaControlsProps {
	playing?: boolean;
	progress?: number;
	volume?: number;
	onTogglePlay?: (playing: boolean) => void;
	onSeek?: (progress: number) => void;
	onVolume?: (volume: number) => void;
}

export function MediaControls(props: MediaControlsProps) {
	const clampedProgress = createMemo(() => Math.max(0, Math.min(100, props.progress ?? 0)));
	const clampedVolume = createMemo(() => Math.max(0, Math.min(100, props.volume ?? 100)));
	const playing = createMemo(() => Boolean(props.playing));

	return (
		<div class="venner-media-controls">
			<button
				type="button"
				class="venner-media-play"
				onClick={() => props.onTogglePlay?.(!playing())}
			>
				{playing() ? "Pause" : "Play"}
			</button>
			<input
				type="range"
				min={0}
				max={100}
				value={clampedProgress()}
				aria-label="Seek"
				onInput={(event) => props.onSeek?.(Number(event.currentTarget.value))}
			/>
			<input
				type="range"
				min={0}
				max={100}
				value={clampedVolume()}
				aria-label="Volume"
				onInput={(event) => props.onVolume?.(Number(event.currentTarget.value))}
			/>
		</div>
	);
}
