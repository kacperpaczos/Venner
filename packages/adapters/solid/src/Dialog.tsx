import { Show, type JSX } from "solid-js";
import "@venner/ui/styles/dialog.css";

interface DialogProps {
	open?: boolean;
	title?: string;
	children?: JSX.Element;
	cancelLabel?: string;
	confirmLabel?: string;
	onCancel?: () => void;
	onConfirm?: () => void;
}

export function Dialog(props: DialogProps) {
	return (
		<Show when={Boolean(props.open)}>
			<div class="venner-dialog-backdrop" role="presentation" onClick={() => props.onCancel?.()}>
				<div class="venner-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
					{props.title ? <header class="venner-dialog-title">{props.title}</header> : null}
					<div class="venner-dialog-body">{props.children}</div>
					<footer class="venner-dialog-actions">
						<button type="button" class="venner-dialog-btn secondary" onClick={() => props.onCancel?.()}>
							{props.cancelLabel ?? "Cancel"}
						</button>
						<button type="button" class="venner-dialog-btn primary" onClick={() => props.onConfirm?.()}>
							{props.confirmLabel ?? "OK"}
						</button>
					</footer>
				</div>
			</div>
		</Show>
	);
}
