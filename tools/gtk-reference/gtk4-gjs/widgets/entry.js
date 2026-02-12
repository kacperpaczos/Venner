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

export function buildEntryScene() {
	const { frame, box } = section("Entry (GTK4)");
	const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });

	const entry = new Gtk.Entry({
		placeholder_text: "Type here",
		width_chars: 24,
	});
	const entryWithText = new Gtk.Entry({ text: "Filled value", width_chars: 24 });
	const disabled = new Gtk.Entry({ text: "Disabled", sensitive: false, width_chars: 24 });

	row.append(entry);
	row.append(entryWithText);
	row.append(disabled);
	box.append(row);
	return frame;
}
