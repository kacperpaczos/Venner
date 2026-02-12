import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

export function buildTabsScene() {
	const group = section("Tabs via ViewSwitcher (Libadwaita)");
	const row = new Adw.ActionRow({ title: "View stack tabs" });

	const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 8, hexpand: true });
	const stack = new Adw.ViewStack({ hexpand: true, vexpand: true });

	const general = new Gtk.Label({ label: "General content" });
	const appearance = new Gtk.Label({ label: "Appearance content" });
	const advanced = new Gtk.Label({ label: "Advanced content" });

	stack.add_titled(general, "general", "General");
	stack.add_titled(appearance, "appearance", "Appearance");
	stack.add_titled(advanced, "advanced", "Advanced");

	const switcher = new Adw.ViewSwitcher({
		stack,
		policy: Adw.ViewSwitcherPolicy.WIDE,
	});

	box.append(switcher);
	box.append(stack);
	row.add_suffix(box);
	row.set_activatable(false);
	group.add(row);
	return group;
}
