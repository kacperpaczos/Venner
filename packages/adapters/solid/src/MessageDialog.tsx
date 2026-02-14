import { Dialog } from "./Dialog";

interface MessageDialogProps {
	open?: boolean;
	title?: string;
	message?: string;
	kind?: "info" | "warning" | "error";
	onClose?: () => void;
}

export function MessageDialog(props: MessageDialogProps) {
	return (
		<Dialog
			open={props.open}
			title={props.title ?? "Message"}
			cancelLabel="Close"
			confirmLabel={props.kind === "error" ? "Dismiss" : "OK"}
			onCancel={props.onClose}
			onConfirm={props.onClose}
		>
			<p class={`venner-message-body ${props.kind ?? "info"}`}>{props.message ?? ""}</p>
		</Dialog>
	);
}
