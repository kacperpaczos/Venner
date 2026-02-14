import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		spacing: 12,
		margin_top: 12,
		margin_bottom: 12,
		margin_start: 12,
		margin_end: 12,
	});
	frame.set_child(box);
	return { frame, box };
}

export function buildDisplayScene() {
	const { frame, box } = section("Display widgets (GTK4)");

	const label = new Gtk.Label({
		xalign: 0,
		label: "Label: token-driven text rendering parity reference",
	});

	const imageRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12 });
	imageRow.append(new Gtk.Image({ icon_name: "image-x-generic-symbolic", pixel_size: 42 }));
	imageRow.append(new Gtk.Image({ icon_name: "folder-pictures-symbolic", pixel_size: 56 }));

	box.append(label);
	box.append(imageRow);
	return frame;
}
