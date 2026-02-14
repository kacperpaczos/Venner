#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";

import { buildButtonScene } from "./widgets/button.js";
import { buildControlsScene } from "./widgets/controls.js";
import { buildEntryScene } from "./widgets/entry.js";
import { buildIndicatorsScene } from "./widgets/indicators.js";
import { buildInputExtraScene } from "./widgets/input-extra.js";
import { buildLayoutScene } from "./widgets/layout.js";
import { buildListScene } from "./widgets/list.js";
import { buildMediaScene } from "./widgets/media.js";
import { buildSwitchScene } from "./widgets/switch.js";
import { buildTabsScene } from "./widgets/tabs.js";

const app = new Gtk.Application({
	application_id: "io.venner.reference.gtk4",
	flags: Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect("startup", () => {
	const settings = Gtk.Settings.get_default();
	if (settings) settings.set_property("gtk-application-prefer-dark-theme", true);
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
	main.append(buildControlsScene());
	main.append(buildEntryScene());
	main.append(buildInputExtraScene());
	main.append(buildSwitchScene());
	main.append(buildIndicatorsScene());
	main.append(buildTabsScene());
	main.append(buildLayoutScene());
	main.append(buildListScene());
	main.append(buildMediaScene());

	const scroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
	scroll.set_child(main);
	win.set_child(scroll);
	win.present();
});

app.run([]);
