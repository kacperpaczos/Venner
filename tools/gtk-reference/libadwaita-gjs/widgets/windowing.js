import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

function section(title) {
	return new Adw.PreferencesGroup({ title });
}

function row(title, widget) {
	const item = new Adw.ActionRow({ title });
	item.add_suffix(widget);
	item.set_activatable(false);
	return item;
}

export function buildWindowingScene() {
	const group = section("Windowing semantics (Libadwaita)");

	const dialogButton = new Gtk.Button({ label: "Open MessageDialog" });
	dialogButton.connect("clicked", () => {
		const dialog = new Gtk.MessageDialog({
			modal: true,
			text: "Libadwaita MessageDialog reference",
			secondary_text: "Semantic parity target for web MessageDialog adapter",
			buttons: Gtk.ButtonsType.OK,
		});
		dialog.connect("response", () => dialog.destroy());
		dialog.present();
	});

	const overlay = new Gtk.Overlay({ hexpand: true });
	overlay.set_child(new Gtk.Label({ label: "Overlay base content", xalign: 0 }));
	overlay.add_overlay(new Gtk.Label({ label: "overlay", xalign: 0 }));

	const scrolled = new Gtk.ScrolledWindow({ min_content_height: 80, hexpand: true });
	const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 6 });
	for (let i = 1; i <= 16; i += 1) {
		content.append(new Gtk.Label({ xalign: 0, label: `Scrolled row ${i}` }));
	}
	scrolled.set_child(content);

	group.add(row("Dialog", dialogButton));
	group.add(row("Overlay", overlay));
	group.add(row("ScrolledWindow", scrolled));
	return group;
}
