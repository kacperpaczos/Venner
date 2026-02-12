import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function buttonRow(title, button) {
	const row = new Adw.ActionRow({ title });
	row.add_suffix(button);
	row.set_activatable(false);
	return row;
}

export function buildButtonScene() {
	const group = section("Button (Libadwaita)");

	const suggested = new Gtk.Button({ label: "Suggested" });
	suggested.add_css_class("suggested-action");
	const defaultBtn = new Gtk.Button({ label: "Default" });
	const destructive = new Gtk.Button({ label: "Destructive" });
	destructive.add_css_class("destructive-action");
	const disabled = new Gtk.Button({ label: "Disabled", sensitive: false });

	group.add(buttonRow("Default", defaultBtn));
	group.add(buttonRow("Suggested", suggested));
	group.add(buttonRow("Destructive", destructive));
	group.add(buttonRow("Disabled", disabled));

	return group;
}
