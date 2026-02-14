import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function switchRow(title, subtitle, active, sensitive = true) {
	return new Adw.SwitchRow({ title, subtitle, active, sensitive });
}

export function buildSwitchScene() {
	const group = section("Switch (Libadwaita)");

	group.add(switchRow("Enabled switch", "Active", true));
	group.add(switchRow("Enabled switch", "Inactive", false));
	group.add(switchRow("Disabled switch", "Inactive", false, false));

	return group;
}
