import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, margin_top: 12, margin_bottom: 12, margin_start: 12, margin_end: 12 });
	frame.set_child(box);
	return { frame, box };
}

export function buildLayoutScene() {
	const { frame, box } = section("Layout interactions (GTK4)");

	const expander = new Gtk.Expander({ label: "Expander", expanded: true });
	expander.set_child(new Gtk.Label({ label: "Expanded content" }));

	const paned = new Gtk.Paned({ orientation: Gtk.Orientation.HORIZONTAL, wide_handle: true, position: 220 });
	paned.set_start_child(new Gtk.Label({ label: "Start pane" }));
	paned.set_end_child(new Gtk.Label({ label: "End pane" }));
	paned.set_size_request(-1, 120);

	const popoverButton = new Gtk.MenuButton({ label: "Popover" });
	popoverButton.set_popover(new Gtk.Popover({ child: new Gtk.Label({ label: "Popover content" }) }));

	box.append(popoverButton);
	box.append(expander);
	box.append(paned);
	return frame;
}
