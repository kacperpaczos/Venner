#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";

import { buildButtonScene } from "../../gtk-reference/gtk4-gjs/widgets/button.js";
import { buildContainersScene } from "../../gtk-reference/gtk4-gjs/widgets/containers.js";
import { buildControlsScene } from "../../gtk-reference/gtk4-gjs/widgets/controls.js";
import { buildDisplayScene } from "../../gtk-reference/gtk4-gjs/widgets/display.js";
import { buildEntryScene } from "../../gtk-reference/gtk4-gjs/widgets/entry.js";
import { buildIndicatorsScene } from "../../gtk-reference/gtk4-gjs/widgets/indicators.js";
import { buildInputExtraScene } from "../../gtk-reference/gtk4-gjs/widgets/input-extra.js";
import { buildLayoutScene } from "../../gtk-reference/gtk4-gjs/widgets/layout.js";
import { buildListScene } from "../../gtk-reference/gtk4-gjs/widgets/list.js";
import { buildMediaScene } from "../../gtk-reference/gtk4-gjs/widgets/media.js";
import { buildMediaControlsScene } from "../../gtk-reference/gtk4-gjs/widgets/media-controls.js";
import { buildSwitchScene } from "../../gtk-reference/gtk4-gjs/widgets/switch.js";
import { buildTabsScene } from "../../gtk-reference/gtk4-gjs/widgets/tabs.js";
import { buildWindowingScene } from "../../gtk-reference/gtk4-gjs/widgets/windowing.js";

const WIDGETS = [
	{ id: "button.default", group: "button", label: "Button", build: buildButtonScene },
	{ id: "containers.main", group: "containers", label: "Containers", build: buildContainersScene },
	{ id: "controls.main", group: "controls", label: "Controls", build: buildControlsScene },
	{ id: "entry.text", group: "entry", label: "Entry", build: buildEntryScene },
	{ id: "input.search", group: "input-extra", label: "Input extras", build: buildInputExtraScene },
	{ id: "display.main", group: "display", label: "Display", build: buildDisplayScene },
	{ id: "switch.main", group: "switch", label: "Switch", build: buildSwitchScene },
	{ id: "indicators.main", group: "indicators", label: "Indicators", build: buildIndicatorsScene },
	{ id: "tabs.main", group: "tabs", label: "Tabs", build: buildTabsScene },
	{ id: "layout.main", group: "layout", label: "Layout", build: buildLayoutScene },
	{ id: "list.main", group: "list", label: "List", build: buildListScene },
	{ id: "media.main", group: "media", label: "Media", build: buildMediaScene },
	{ id: "media-controls.main", group: "media-controls", label: "Media controls", build: buildMediaControlsScene },
	{ id: "windowing.main", group: "windowing", label: "Windowing", build: buildWindowingScene },
];

const GROUPS = [...new Set(WIDGETS.map((w) => w.group))].map((groupId) => ({
	id: groupId,
	label: WIDGETS.find((w) => w.group === groupId)?.label ?? groupId,
}));

let currentGroup = "button";
let currentWidget = "button.default";
let currentState = "default";

const app = new Gtk.Application({
	application_id: "io.venner.viewer.gtk4.widgets",
	flags: Gio.ApplicationFlags.FLAGS_NONE,
});

let statusLabel = null;
let previewFrame = null;
let listBox = null;
let windowRef = null;

function emit(method, params = {}) {
	print(JSON.stringify({ method, params }));
}

function normalizeWidgetId(widgetId) {
	const found = WIDGETS.find((widget) => widget.id === widgetId);
	if (found) return found.id;
	const group = String(widgetId).split(".")[0];
	const fromGroup = WIDGETS.find((widget) => widget.group === group);
	return fromGroup ? fromGroup.id : "button.default";
}

function updateStatus() {
	if (!statusLabel) return;
	statusLabel.set_label(`group=${currentGroup} widget=${currentWidget} state=${currentState}`);
	emit("state_changed", { activeGroup: currentGroup, activeWidget: currentWidget, state: currentState });
}

function renderWidget(widgetId) {
	const normalized = normalizeWidgetId(widgetId);
	const widget = WIDGETS.find((entry) => entry.id === normalized);
	if (!widget || !previewFrame) return;

	currentWidget = widget.id;
	currentGroup = widget.group;

	const child = previewFrame.get_child();
	if (child) previewFrame.set_child(null);
	previewFrame.set_child(widget.build());
	updateStatus();
}

function renderGroup(groupId) {
	const target = WIDGETS.find((widget) => widget.group === groupId);
	if (!target) {
		emit("error", { code: "group_not_found", message: groupId });
		return;
	}
	renderWidget(target.id);
}

function focusListSelection(widgetId) {
	if (!listBox) return;
	let row = listBox.get_first_child();
	while (row) {
		if (row.widgetId === widgetId) {
			listBox.select_row(row);
			break;
		}
		row = row.get_next_sibling();
	}
}

function handleCommand(line) {
	let message = null;
	try {
		message = JSON.parse(line);
	} catch {
		emit("error", { code: "invalid_json", message: line });
		return;
	}

	const method = message.method;
	const params = message.params ?? {};

	switch (method) {
		case "ping":
			emit("ready", { viewerId: "gtk4-widget-viewer", tech: "gtk4", kind: "widget" });
			break;
		case "show_widget_group":
			renderGroup(String(params.groupId ?? "button"));
			focusListSelection(currentWidget);
			break;
		case "show_widget":
			currentState = String(params.state ?? currentState);
			renderWidget(String(params.widgetId ?? currentWidget));
			focusListSelection(currentWidget);
			break;
		case "list_groups":
			emit("groups", { items: GROUPS });
			break;
		case "list_widgets":
			emit("widgets", { items: WIDGETS.map((widget) => ({ id: widget.id, groupId: widget.group })) });
			break;
		case "shutdown":
			if (windowRef) windowRef.close();
			app.quit();
			break;
		default:
			emit("log", { level: "warn", message: `unsupported method=${method}` });
	}
}

function startStdinLoop() {
	try {
		const stream = new Gio.DataInputStream({
			base_stream: new Gio.UnixInputStream({ fd: 0, close_fd: false }),
		});
		const loop = () => {
			stream.read_line_async(GLib.PRIORITY_DEFAULT, null, (input, result) => {
				try {
					const [line] = input.read_line_finish_utf8(result);
					if (line !== null) {
						handleCommand(line.trim());
						loop();
					}
				} catch {
					emit("error", { code: "stdin_read_failed", message: "Unable to read stdin" });
				}
			});
		};
		loop();
	} catch {
		emit("error", { code: "stdin_unavailable", message: "stdin unavailable" });
	}
}

app.connect("startup", () => {
	startStdinLoop();
});

app.connect("activate", () => {
	const win = new Gtk.ApplicationWindow({
		application: app,
		title: "GTK4 Widget Viewer",
		default_width: 980,
		default_height: 760,
	});
	windowRef = win;

	const root = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		spacing: 8,
		margin_top: 10,
		margin_bottom: 10,
		margin_start: 10,
		margin_end: 10,
	});

	statusLabel = new Gtk.Label({ xalign: 0, label: "group=button widget=button.default state=default" });
	root.append(statusLabel);

	const pane = new Gtk.Paned({ orientation: Gtk.Orientation.HORIZONTAL, wide_handle: true, position: 220 });

	listBox = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.SINGLE });
	for (const item of WIDGETS) {
		const row = new Gtk.ListBoxRow();
		row.widgetId = item.id;
		row.set_child(new Gtk.Label({ xalign: 0, label: item.label }));
		listBox.append(row);
	}
	listBox.connect("row-selected", (_, row) => {
		if (!row) return;
		const widgetId = row.widgetId;
		if (!widgetId) return;
		renderWidget(widgetId);
	});

	const left = new Gtk.ScrolledWindow({ hexpand: false, vexpand: true, min_content_width: 220 });
	left.set_child(listBox);
	pane.set_start_child(left);

	previewFrame = new Gtk.Frame({ hexpand: true, vexpand: true });
	const right = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
	right.set_child(previewFrame);
	pane.set_end_child(right);

	root.append(pane);
	win.set_child(root);
	win.present();
	renderWidget("button.default");
	focusListSelection("button.default");
	emit("ready", { viewerId: "gtk4-widget-viewer", tech: "gtk4", kind: "widget" });
});

app.run([]);
