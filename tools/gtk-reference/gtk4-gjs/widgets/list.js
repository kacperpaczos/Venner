import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, margin_top: 12, margin_bottom: 12, margin_start: 12, margin_end: 12 });
	frame.set_child(box);
	return { frame, box };
}

export function buildListScene() {
	const { frame, box } = section("ListView (GTK4)");

	const model = Gtk.StringList.new(["General", "Appearance", "Shortcuts", "Advanced"]);
	const selection = new Gtk.SingleSelection({ model });
	selection.set_selected(1);

	const factory = new Gtk.SignalListItemFactory();
	factory.connect("setup", (_f, item) => {
		item.set_child(new Gtk.Label({ xalign: 0 }));
	});
	factory.connect("bind", (_f, item) => {
		const label = item.get_child();
		const stringObject = item.get_item();
		if (label && stringObject) label.set_text(stringObject.get_string());
	});

	const list = new Gtk.ListView({ model: selection, factory, vexpand: true });
	list.set_size_request(-1, 120);
	box.append(list);
	return frame;
}
