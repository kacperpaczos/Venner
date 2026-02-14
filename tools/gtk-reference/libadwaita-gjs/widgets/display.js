import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function row(title, widget) {
	const item = new Adw.ActionRow({ title });
	item.add_suffix(widget);
	item.set_activatable(false);
	return item;
}

export function buildDisplayScene() {
	const group = section("Display widgets (Libadwaita)");
	group.add(row("Label", new Gtk.Label({ label: "Label parity reference", xalign: 0 })));
	group.add(row("Image", new Gtk.Image({ icon_name: "image-x-generic-symbolic", pixel_size: 42 })));
	group.add(row("Picture", new Gtk.Image({ icon_name: "folder-pictures-symbolic", pixel_size: 56 })));
	return group;
}
