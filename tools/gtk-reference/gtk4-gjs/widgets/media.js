import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, margin_top: 12, margin_bottom: 12, margin_start: 12, margin_end: 12 });
	frame.set_child(box);
	return { frame, box };
}

export function buildMediaScene() {
	const { frame, box } = section("Media basics (GTK4)");
	const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12 });

	const image = new Gtk.Image({ icon_name: "image-x-generic-symbolic", pixel_size: 48 });
	const picture = new Gtk.Image({ icon_name: "folder-pictures-symbolic", pixel_size: 64 });

	row.append(image);
	row.append(picture);
	box.append(row);
	return frame;
}
