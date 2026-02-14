import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

export function buildListScene() {
	const group = section("ListView (Libadwaita)");
	const listBox = new Gtk.ListBox();
	for (const label of ["General", "Appearance", "Shortcuts", "Advanced"]) {
		listBox.append(new Gtk.Label({ label, xalign: 0 }));
	}
	const row = new Adw.ActionRow({ title: "List" });
	row.add_suffix(listBox);
	row.set_activatable(false);
	group.add(row);
	return group;
}
