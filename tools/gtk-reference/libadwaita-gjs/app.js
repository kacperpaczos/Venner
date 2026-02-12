#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import Adw from "gi://Adw?version=1";

import { buildButtonScene } from "./widgets/button.js";
import { buildEntryScene } from "./widgets/entry.js";
import { buildSwitchScene } from "./widgets/switch.js";
import { buildTabsScene } from "./widgets/tabs.js";

const app = new Adw.Application({
	application_id: "io.venner.reference.libadwaita",
	flags: Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect("activate", () => {
	const win = new Adw.ApplicationWindow({
		application: app,
		title: "Venner Libadwaita Reference",
		default_width: 960,
		default_height: 700,
	});

	const content = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		spacing: 16,
		margin_top: 16,
		margin_bottom: 16,
		margin_start: 16,
		margin_end: 16,
	});

	content.append(buildButtonScene());
	content.append(buildEntryScene());
	content.append(buildSwitchScene());
	content.append(buildTabsScene());

	const scroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
	scroll.set_child(content);
	win.set_content(scroll);
	win.present();
});

app.run([]);
