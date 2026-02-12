import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	const group = new Adw.PreferencesGroup({ title });
	return group;
}

export function buildButtonScene() {
	const group = section("Button (Libadwaita)");
	const row = new Adw.ActionRow({ title: "Button states" });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });

	const primary = new Gtk.Button({ label: "Suggested" });
	primary.add_css_class("suggested-action");
	const secondary = new Gtk.Button({ label: "Default" });
	const destructive = new Gtk.Button({ label: "Destructive" });
	destructive.add_css_class("destructive-action");
	const disabled = new Gtk.Button({ label: "Disabled", sensitive: false });

	box.append(primary);
	box.append(secondary);
	box.append(destructive);
	box.append(disabled);
	row.add_suffix(box);
	row.set_activatable(false);
	group.add(row);
	return group;
}
