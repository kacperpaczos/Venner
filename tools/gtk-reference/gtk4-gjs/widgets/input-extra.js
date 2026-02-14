import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, margin_top: 12, margin_bottom: 12, margin_start: 12, margin_end: 12 });
	frame.set_child(box);
	return { frame, box };
}

export function buildInputExtraScene() {
	const { frame, box } = section("Input extras (GTK4)");
	const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });

	const search = new Gtk.SearchEntry({ width_chars: 18, placeholder_text: "Search" });
	const password = new Gtk.PasswordEntry({ width_chars: 18, placeholder_text: "Password" });
	const adj = new Gtk.Adjustment({ lower: 0, upper: 99, step_increment: 1, page_increment: 10, value: 12 });
	const spin = new Gtk.SpinButton({ adjustment: adj });

	row.append(search);
	row.append(password);
	row.append(spin);
	box.append(row);
	return frame;
}
