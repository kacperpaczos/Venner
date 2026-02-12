import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function switchRow(title, subtitle, active, sensitive = true) {
	const row = new Adw.ActionRow({ title, subtitle, activatable_widget: null });
	row.set_activatable(false);
	const sw = new Gtk.Switch({ active, sensitive });
	row.add_suffix(sw);
	return row;
}

export function buildSwitchScene() {
	const group = section("Switch (Libadwaita)");

	group.add(switchRow("Enabled switch", "Active", true));
	group.add(switchRow("Enabled switch", "Inactive", false));
	group.add(switchRow("Disabled switch", "Inactive", false, false));

	return group;
}
