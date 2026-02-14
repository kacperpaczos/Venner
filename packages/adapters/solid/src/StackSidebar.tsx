import { For, Show, createEffect, createSignal } from "solid-js";
import "@venner/ui/styles/stack-sidebar.css";

export interface StackSidebarItem {
	id: string;
	label: string;
	content: string;
}

interface StackSidebarProps {
	items: StackSidebarItem[];
	activeId?: string;
	onChange?: (id: string) => void;
}

export function StackSidebar(props: StackSidebarProps) {
	const firstId = () => props.items[0]?.id ?? "";
	const [active, setActive] = createSignal(props.activeId ?? firstId());

	createEffect(() => {
		if (props.activeId) setActive(props.activeId);
	});

	return (
		<div class="venner-stack-sidebar">
			<aside class="venner-stack-sidebar-nav">
				<For each={props.items}>
					{(item) => (
						<button
							type="button"
							class="venner-stack-sidebar-item"
							data-active={active() === item.id}
							onClick={() => {
								setActive(item.id);
								props.onChange?.(item.id);
							}}
						>
							{item.label}
						</button>
					)}
				</For>
			</aside>
			<section class="venner-stack-sidebar-content">
				<Show when={props.items.find((entry) => entry.id === active())}>
					{(entry) => entry().content}
				</Show>
			</section>
		</div>
	);
}
