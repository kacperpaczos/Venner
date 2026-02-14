import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function row(title, widget) {
	const r = new Adw.ActionRow({ title });
	r.add_suffix(widget);
	r.set_activatable(false);
	return r;
}

export function buildMediaScene() {
	const group = section("Media basics (Libadwaita)");
	group.add(row("Image", new Gtk.Image({ icon_name: "image-x-generic-symbolic", pixel_size: 48 })));
	group.add(row("Picture", new Gtk.Image({ icon_name: "folder-pictures-symbolic", pixel_size: 64 })));
	return group;
}
