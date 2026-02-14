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

export function buildInputExtraScene() {
	const group = section("Input extras (Libadwaita)");
	const adj = new Gtk.Adjustment({ lower: 0, upper: 99, step_increment: 1, page_increment: 10, value: 12 });
	group.add(row("Search", new Gtk.SearchEntry({ width_chars: 18, placeholder_text: "Search" })));
	group.add(row("Password", new Gtk.PasswordEntry({ width_chars: 18, placeholder_text: "Password" })));
	group.add(row("Spin", new Gtk.SpinButton({ adjustment: adj })));
	return group;
}
