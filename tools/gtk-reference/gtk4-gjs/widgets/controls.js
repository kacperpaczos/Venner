import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, margin_top: 12, margin_bottom: 12, margin_start: 12, margin_end: 12 });
	frame.set_child(box);
	return { frame, box };
}

export function buildControlsScene() {
	const { frame, box } = section("Controls (GTK4)");
	const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });

	const toggle = new Gtk.ToggleButton({ label: "Toggle" });
	const check = new Gtk.CheckButton({ label: "Check" });
	const link = new Gtk.LinkButton({ label: "Docs", uri: "https://docs.gtk.org/gtk4/" });
	const menuButton = new Gtk.MenuButton({ label: "Menu" });
	const menu = Gtk.PopoverMenu.new_from_model(null);
	menuButton.set_popover(menu);

	row.append(toggle);
	row.append(check);
	row.append(link);
	row.append(menuButton);
	box.append(row);
	return frame;
}
