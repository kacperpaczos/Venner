import { For, createSignal } from "solid-js";
import "@venner/ui/styles/tabs.css";

export interface TabItem {
	id: string;
	label: string;
	content: string;
}

interface TabsProps {
	items: TabItem[];
	defaultTabId?: string;
}

export function Tabs(props: TabsProps) {
	const first = () => props.items[0]?.id ?? "";
	const [activeId, setActiveId] = createSignal(props.defaultTabId ?? first());

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
							onClick={() => setActiveId(item.id)}
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
