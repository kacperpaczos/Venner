import "@venner/ui/styles/image.css";

interface ImageProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	fit?: "cover" | "contain" | "fill";
}

export function Image(props: ImageProps) {
	return (
		<img
			class="venner-image"
			src={props.src}
			alt={props.alt}
			width={props.width}
			height={props.height}
			style={{ "object-fit": props.fit ?? "cover" }}
		/>
	);
}
