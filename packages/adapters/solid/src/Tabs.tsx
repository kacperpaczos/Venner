import { For, createEffect, createSignal } from "solid-js";
import "@venner/ui/styles/tabs.css";

export interface TabItem {
	id: string;
	label: string;
	content: string;
}

interface TabsProps {
	items: TabItem[];
	defaultTabId?: string;
	activeTabId?: string;
	onChange?: (tabId: string) => void;
}

export function Tabs(props: TabsProps) {
	const first = () => props.items[0]?.id ?? "";
	const [activeId, setActiveId] = createSignal(
		props.activeTabId ?? props.defaultTabId ?? first(),
	);

	createEffect(() => {
		if (props.activeTabId) setActiveId(props.activeTabId);
	});

	return (
		<div class="venner-tabs">
			<div class="venner-tablist" role="tablist">
				<For each={props.items}>
					{(item) => (
						<button
							type="button"
							role="tab"
							class="venner-tab"
							data-active={activeId() === item.id}
							aria-selected={activeId() === item.id}
							onClick={() => {
								setActiveId(item.id);
								props.onChange?.(item.id);
							}}
						>
							{item.label}
						</button>
					)}
				</For>
			</div>
			<div class="venner-tabpanel" role="tabpanel">
				{props.items.find((item) => item.id === activeId())?.content}
			</div>
		</div>
	);
}
