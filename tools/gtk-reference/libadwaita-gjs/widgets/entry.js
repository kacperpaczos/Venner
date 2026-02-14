import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function entryRow(title, entry) {
	const row = new Adw.ActionRow({ title });
	row.add_suffix(entry);
	row.set_activatable(false);
	return row;
}

export function buildEntryScene() {
	const group = section("Entry (Libadwaita)");

	const empty = new Gtk.Entry({ placeholder_text: "Type here", width_chars: 20 });
	const filled = new Gtk.Entry({ text: "Filled value", width_chars: 20 });
	const disabled = new Gtk.Entry({ text: "Disabled", width_chars: 20, sensitive: false });

	group.add(entryRow("Empty", empty));
	group.add(entryRow("Filled", filled));
	group.add(entryRow("Disabled", disabled));

	return group;
}
