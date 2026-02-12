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

export function buildButtonScene() {
	const { frame, box } = section("Button (GTK4)");
	const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });

	const primary = new Gtk.Button({ label: "Default" });
	const suggested = new Gtk.Button({ label: "Suggested" });
	suggested.add_css_class("suggested-action");
	const destructive = new Gtk.Button({ label: "Destructive" });
	destructive.add_css_class("destructive-action");
	const disabled = new Gtk.Button({ label: "Disabled", sensitive: false });

	row.append(primary);
	row.append(suggested);
	row.append(destructive);
	row.append(disabled);
	box.append(row);
	return frame;
}
