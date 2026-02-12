import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

export function buildEntryScene() {
	const group = section("Entry (Libadwaita)");
	const row = new Adw.ActionRow({ title: "Entry states" });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });

	const empty = new Gtk.Entry({ placeholder_text: "Type here", width_chars: 20 });
	const filled = new Gtk.Entry({ text: "Filled value", width_chars: 20 });
	const disabled = new Gtk.Entry({ text: "Disabled", width_chars: 20, sensitive: false });

	box.append(empty);
	box.append(filled);
	box.append(disabled);
	row.add_suffix(box);
	row.set_activatable(false);
	group.add(row);
	return group;
}
