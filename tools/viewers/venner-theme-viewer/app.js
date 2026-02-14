#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";

const MANIFEST_PATH = "tools/viewers/manifests/themes/venner.json";

function readManifest() {
	try {
		const file = Gio.File.new_for_path(MANIFEST_PATH);
		const [ok, contents] = file.load_contents(null);
		if (!ok) return { tokens: [], palette: [] };
		return JSON.parse(imports.byteArray.toString(contents));
	} catch {
		return { tokens: [], palette: [] };
	}
}

const manifest = readManifest();
let currentPreset = "default";
let overrideTokens = {};

const app = new Gtk.Application({
	application_id: "io.venner.viewer.venner.theme",
	flags: Gio.ApplicationFlags.FLAGS_NONE,
});

let statusLabel = null;
let tokensView = null;
let paletteBox = null;
let windowRef = null;

function emit(method, params = {}) {
	print(JSON.stringify({ method, params }));
}

function diagnostics() {
	const tokenCount = Object.keys(overrideTokens).length > 0 ? Object.keys(overrideTokens).length : (manifest.tokens?.length ?? 0);
	return {
		source: "live_runtime+manifest",
		themeName: "venner",
		paletteName: currentPreset,
		tokensCount: tokenCount,
		warnings: [],
	};
}

function renderTheme() {
	if (!tokensView || !paletteBox || !statusLabel) return;
	const merged = new Map();
	for (const token of manifest.tokens ?? []) merged.set(token.name, token.value);
	for (const [name, value] of Object.entries(overrideTokens)) merged.set(name, String(value));

	const lines = Array.from(merged.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([name, value]) => `${name}: ${value}`)
		.join("\n");
	tokensView.get_buffer().set_text(lines, -1);

	while (paletteBox.get_first_child()) {
		paletteBox.remove(paletteBox.get_first_child());
	}

	for (const item of manifest.palette ?? []) {
		const color = overrideTokens[item.name] ?? item.value;
		const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
		row.append(new Gtk.Label({ xalign: 0, label: `${item.name}: ${color}` }));
		paletteBox.append(row);
	}

	const diag = diagnostics();
	statusLabel.set_label(`theme=${diag.themeName} source=${diag.source} preset=${diag.paletteName} tokens=${diag.tokensCount}`);
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
			emit("ready", { viewerId: "venner-theme-viewer", tech: "venner", kind: "theme" });
			break;
		case "set_theme_preset":
			currentPreset = String(params.presetId ?? "default");
			renderTheme();
			emit("theme_changed", { preset: currentPreset });
			break;
		case "set_palette_override":
			overrideTokens = params.tokens ?? {};
			renderTheme();
			emit("theme_changed", { preset: currentPreset });
			break;
		case "get_theme_diagnostics":
			emit("theme_diagnostics", diagnostics());
			break;
		case "list_groups":
			emit("groups", { items: [] });
			break;
		case "list_widgets":
			emit("widgets", { items: [] });
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
		title: "Venner Theme Viewer",
		default_width: 900,
		default_height: 700,
	});
	windowRef = win;

	const main = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		spacing: 10,
		margin_top: 12,
		margin_bottom: 12,
		margin_start: 12,
		margin_end: 12,
	});

	statusLabel = new Gtk.Label({ xalign: 0, label: "loading..." });
	main.append(statusLabel);

	tokensView = new Gtk.TextView({ editable: false, monospace: true, vexpand: true, hexpand: true });
	const tokenScroll = new Gtk.ScrolledWindow({ vexpand: true, hexpand: true });
	tokenScroll.set_child(tokensView);
	main.append(tokenScroll);

	paletteBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 6 });
	const paletteScroll = new Gtk.ScrolledWindow({ vexpand: true, hexpand: true });
	paletteScroll.set_child(paletteBox);
	main.append(paletteScroll);

	win.set_child(main);
	win.present();
	renderTheme();
	emit("ready", { viewerId: "venner-theme-viewer", tech: "venner", kind: "theme" });
	emit("theme_diagnostics", diagnostics());
});

app.run([]);
