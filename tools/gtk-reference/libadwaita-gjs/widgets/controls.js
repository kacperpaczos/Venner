import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function row(title, widget) {
	const r = new Adw.ActionRow({ title });
	r.add_suffix(widget);
	r.set_activatable(false);
	return r;
}

export function buildControlsScene() {
	const group = section("Controls (Libadwaita)");
	group.add(row("Toggle", new Gtk.ToggleButton({ label: "Toggle" })));
	group.add(row("Check", new Gtk.CheckButton({ label: "Check" })));
	group.add(row("Link", new Gtk.LinkButton({ label: "Docs", uri: "https://docs.gtk.org/gtk4/" })));
	group.add(row("Menu", new Gtk.MenuButton({ label: "Menu" })));
	return group;
}
