import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		spacing: 12,
		margin_top: 12,
		margin_bottom: 12,
		margin_start: 12,
		margin_end: 12,
	});
	frame.set_child(box);
	return { frame, box };
}

export function buildWindowingScene() {
	const { frame, box } = section("Windowing semantics (GTK4)");

	const dialogButton = new Gtk.Button({ label: "Open MessageDialog" });
	dialogButton.connect("clicked", () => {
		const dialog = new Gtk.MessageDialog({
			modal: true,
			text: "GTK4 MessageDialog reference",
			secondary_text: "Semantic parity target for web Dialog adapter",
			buttons: Gtk.ButtonsType.OK,
		});
		dialog.connect("response", () => dialog.destroy());
		dialog.present();
	});

	const overlay = new Gtk.Overlay({ hexpand: true });
	const base = new Gtk.Label({ label: "Overlay base content", xalign: 0 });
	const badge = new Gtk.Label({ label: "overlay", xalign: 0 });
	badge.add_css_class("caption");
	overlay.set_child(base);
	overlay.add_overlay(badge);

	const scrolled = new Gtk.ScrolledWindow({ min_content_height: 80, hexpand: true });
	const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 6 });
	for (let i = 1; i <= 16; i += 1) {
		content.append(new Gtk.Label({ xalign: 0, label: `Scrolled row ${i}` }));
	}
	scrolled.set_child(content);

	box.append(dialogButton);
	box.append(overlay);
	box.append(scrolled);
	return frame;
}
