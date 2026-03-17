import { invoke } from "@tauri-apps/api/core";

export type ViewerKind = "widget" | "theme";
export type ViewerTech = "gtk4" | "adw" | "venner";

export interface ViewerDefinition {
	id: string;
	title: string;
	tech: ViewerTech;
	kind: ViewerKind;
	command: string;
	args: string[];
}

export interface ViewerRuntimeStatus {
	viewerId: string;
	pid: number | null;
	running: boolean;
	startedAt: number;
	command: string;
	args: string[];
}

export interface ViewerLogEvent {
	viewerId: string;
	stream: string;
	line: string;
	ts: number;
}

export interface ViewerMessage {
	method: string;
	params?: Record<string, unknown>;
}

export interface GtkReferenceSummary {
	baseline: {
		gtkVersion: string;
		gtkSourceTag: string;
		gtkSourceCommitSha: string;
		baselineDate: string;
	};
	coverage: {
		totalRows: number;
		l3: number;
		l2: number;
		l1: number;
		na: number;
	};
	policy: {
		doneGate: string[];
		deltaVsGtk: string;
	};
}

export const HUB_VIEWERS: ViewerDefinition[] = [
	{
		id: "gtk4-widget-viewer",
		title: "GTK4 Widget Viewer",
		tech: "gtk4",
		kind: "widget",
		command: "gjs",
		args: ["-m", "tools/viewers/gtk4-widget-viewer/app.js"],
	},
	{
		id: "adw-widget-viewer",
		title: "Libadwaita Widget Viewer",
		tech: "adw",
		kind: "widget",
		command: "gjs",
		args: ["-m", "tools/viewers/adw-widget-viewer/app.js"],
	},
	{
		id: "venner-widget-viewer",
		title: "Venner Widget Viewer",
		tech: "venner",
		kind: "widget",
		command: "gjs",
		args: ["-m", "tools/viewers/venner-widget-viewer/app.js"],
	},
	{
		id: "gtk4-theme-viewer",
		title: "GTK4 Theme Viewer",
		tech: "gtk4",
		kind: "theme",
		command: "gjs",
		args: ["-m", "tools/viewers/gtk4-theme-viewer/app.js"],
	},
	{
		id: "adw-theme-viewer",
		title: "Libadwaita Theme Viewer",
		tech: "adw",
		kind: "theme",
		command: "gjs",
		args: ["-m", "tools/viewers/adw-theme-viewer/app.js"],
	},
	{
		id: "venner-theme-viewer",
		title: "Venner Theme Viewer",
		tech: "venner",
		kind: "theme",
		command: "gjs",
		args: ["-m", "tools/viewers/venner-theme-viewer/app.js"],
	},
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getViewer = (kind: ViewerKind, tech: ViewerTech) =>
	HUB_VIEWERS.find((viewer) => viewer.kind === kind && viewer.tech === tech) ?? null;

export const spawnViewer = async (viewer: ViewerDefinition) =>
	invoke<ViewerRuntimeStatus>("viewer_spawn", {
		viewerId: viewer.id,
		command: viewer.command,
		args: viewer.args,
	});

export const stopViewer = async (viewerId: string) => {
	await invoke("viewer_stop", { viewerId });
};

export const sendViewerCommand = async (viewerId: string, message: ViewerMessage) => {
	await invoke("viewer_send", { viewerId, line: JSON.stringify(message) });
};

export const listViewerStatus = async () => invoke<ViewerRuntimeStatus[]>("viewer_list");

export const pollViewerLogs = async (limit = 100) => invoke<ViewerLogEvent[]>("viewer_poll_logs", { limit });

export const loadViewerManifest = async (kind: "themes" | "widgets", tech: ViewerTech) =>
	invoke<Record<string, unknown>>("viewer_load_manifest", { kind, tech });

export const loadGtkReferenceSummary = async () =>
	invoke<GtkReferenceSummary>("load_gtk_reference_summary");

export const startWidgetViewersWithPreset = async (input: {
	techs: ViewerTech[];
	widgetId: string;
	groupId: string;
	state: string;
}) => {
	for (const tech of input.techs) {
		const viewer = getViewer("widget", tech);
		if (!viewer) continue;

		try {
			await stopViewer(viewer.id);
		} catch {
			// no-op: viewer might not be running
		}

		await spawnViewer(viewer);
		await sleep(150);
		await sendViewerCommand(viewer.id, {
			method: "show_widget_group",
			params: { groupId: input.groupId },
		});
		await sendViewerCommand(viewer.id, {
			method: "show_widget",
			params: { widgetId: input.widgetId, state: input.state },
		});
	}
};

export const startThemeViewers = async (techs: ViewerTech[]) => {
	for (const tech of techs) {
		const viewer = getViewer("theme", tech);
		if (!viewer) continue;

		try {
			await stopViewer(viewer.id);
		} catch {
			// no-op: viewer might not be running
		}

		await spawnViewer(viewer);
		await sleep(150);
		await sendViewerCommand(viewer.id, { method: "get_theme_diagnostics" });
	}
};

const WINDOW_RUNNER_PREVIEW_ID = "window-runner-preview";

export const startWindowRunnerPreview = async () => {
	try {
		await stopViewer(WINDOW_RUNNER_PREVIEW_ID);
	} catch {
		// no-op: preview might not be running
	}

	await invoke<ViewerRuntimeStatus>("viewer_spawn", {
		viewerId: WINDOW_RUNNER_PREVIEW_ID,
		command: "bash",
		args: ["-lc", "bun run dev"],
		cwd: "apps/window-runner",
	});
};

export const stopWindowRunnerPreview = async () => {
	await stopViewer(WINDOW_RUNNER_PREVIEW_ID);
};

export const getWindowRunnerPreviewId = () => WINDOW_RUNNER_PREVIEW_ID;
