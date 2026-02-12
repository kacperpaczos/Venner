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

export function buildSwitchScene() {
	const { frame, box } = section("Switch (GTK4)");
	const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12 });

	const off = new Gtk.Switch({ active: false });
	const on = new Gtk.Switch({ active: true });
	const disabled = new Gtk.Switch({ active: true, sensitive: false });

	row.append(off);
	row.append(on);
	row.append(disabled);
	box.append(row);
	return frame;
}
