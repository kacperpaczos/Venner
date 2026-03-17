import { createSignal, onCleanup, onMount, type JSX } from "solid-js";
import "@venner/ui/styles/page.css";

interface PageProps {
	children?: JSX.Element;
	class?: string;
	fadeInDurationMs?: number;
	onLoaded?: () => void;
}

export function Page(props: PageProps) {
	const [visible, setVisible] = createSignal(false);

	onMount(() => {
		setVisible(true);
		const duration = Math.max(0, props.fadeInDurationMs ?? 300);
		const timer = window.setTimeout(() => props.onLoaded?.(), duration);
		onCleanup(() => window.clearTimeout(timer));
	});

	return (
		<section
			class={`venner-page ${props.class ?? ""}`.trim()}
			data-visible={visible() ? "true" : "false"}
		>
			{props.children}
		</section>
	);
}
