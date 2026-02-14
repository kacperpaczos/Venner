import { Dialog } from "./Dialog";

interface AboutDialogProps {
	open?: boolean;
	appName: string;
	version?: string;
	website?: string;
	license?: string;
	comments?: string;
	onClose?: () => void;
}

export function AboutDialog(props: AboutDialogProps) {
	return (
		<Dialog
			open={props.open}
			title={`About ${props.appName}`}
			cancelLabel="Close"
			confirmLabel="OK"
			onCancel={props.onClose}
			onConfirm={props.onClose}
		>
			<div class="venner-about-dialog">
				<p><strong>{props.appName}</strong>{props.version ? ` ${props.version}` : ""}</p>
				{props.comments ? <p>{props.comments}</p> : null}
				{props.website ? <p><a href={props.website} target="_blank" rel="noreferrer">{props.website}</a></p> : null}
				{props.license ? <p>License: {props.license}</p> : null}
			</div>
		</Dialog>
	);
}
