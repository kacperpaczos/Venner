import { For } from "solid-js";
import "@venner/ui/styles/picture.css";

interface PictureSource {
	srcset: string;
	media?: string;
	type?: string;
}

interface PictureProps {
	sources?: PictureSource[];
	src: string;
	alt: string;
	width?: number;
	height?: number;
}

export function Picture(props: PictureProps) {
	return (
		<picture class="venner-picture">
			<For each={props.sources ?? []}>
				{(source) => (
					<source srcset={source.srcset} media={source.media} type={source.type} />
				)}
			</For>
			<img
				class="venner-picture-image"
				src={props.src}
				alt={props.alt}
				width={props.width}
				height={props.height}
			/>
		</picture>
	);
}
