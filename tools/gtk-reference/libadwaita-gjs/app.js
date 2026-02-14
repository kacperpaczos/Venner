#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import Adw from "gi://Adw?version=1";

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

	const headerBar = new Adw.HeaderBar();

	const content = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		spacing: 24,
	});

	content.append(buildButtonScene());
	content.append(buildControlsScene());
	content.append(buildEntryScene());
	content.append(buildInputExtraScene());
	content.append(buildSwitchScene());
	content.append(buildIndicatorsScene());
	content.append(buildTabsScene());
	content.append(buildLayoutScene());
	content.append(buildListScene());
	content.append(buildMediaScene());

	const clamp = new Adw.Clamp({
		maximum_size: 800,
	});
	clamp.set_child(content);

	const scroll = new Gtk.ScrolledWindow({ hexpand: true, vexpand: true });
	scroll.set_child(clamp);

	const toolbarView = new Adw.ToolbarView();
	toolbarView.add_top_bar(headerBar);
	toolbarView.content = scroll;

	win.set_content(toolbarView);
	win.present();
});

app.run([]);
