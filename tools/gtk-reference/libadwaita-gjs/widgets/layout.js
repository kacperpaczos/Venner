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

export function buildLayoutScene() {
	const group = section("Layout interactions (Libadwaita)");
	const expander = new Gtk.Expander({ label: "Expander", expanded: true });
	expander.set_child(new Gtk.Label({ label: "Expanded content" }));
	const popover = new Gtk.MenuButton({ label: "Popover" });
	popover.set_popover(new Gtk.Popover({ child: new Gtk.Label({ label: "Popover content" }) }));
	const paned = new Gtk.Paned({ orientation: Gtk.Orientation.HORIZONTAL, wide_handle: true, position: 220 });
	paned.set_start_child(new Gtk.Label({ label: "Start pane" }));
	paned.set_end_child(new Gtk.Label({ label: "End pane" }));
	paned.set_size_request(340, 100);

	group.add(row("Popover", popover));
	group.add(row("Expander", expander));
	group.add(row("Paned", paned));
	return group;
}
