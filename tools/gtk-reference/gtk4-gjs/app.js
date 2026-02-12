#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";

import { buildButtonScene } from "./widgets/button.js";
import { buildEntryScene } from "./widgets/entry.js";
import { buildSwitchScene } from "./widgets/switch.js";
import { buildTabsScene } from "./widgets/tabs.js";

const app = new Gtk.Application({
	application_id: "io.venner.reference.gtk4",
	flags: Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect("activate", () => {
	const win = new Gtk.ApplicationWindow({
		application: app,
		title: "Venner GTK4 Reference",
		default_width: 960,
		default_height: 700,
	});

	const main = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		spacing: 16,
		margin_top: 16,
		margin_bottom: 16,
		margin_start: 16,
		margin_end: 16,
	});

	main.append(buildButtonScene());
	main.append(buildEntryScene());
	main.append(buildSwitchScene());
	main.append(buildTabsScene());

	const scroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
	scroll.set_child(main);
	win.set_child(scroll);
	win.present();
});

app.run([]);
