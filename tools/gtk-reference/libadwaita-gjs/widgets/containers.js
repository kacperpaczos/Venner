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

export function buildContainersScene() {
	const group = section("Container widgets (Libadwaita)");

	const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
	box.append(new Gtk.Button({ label: "Start" }));
	box.append(new Gtk.Button({ label: "Center" }));
	box.append(new Gtk.Button({ label: "End" }));

	const grid = new Gtk.Grid({ row_spacing: 6, column_spacing: 6 });
	grid.attach(new Gtk.Label({ label: "R1C1" }), 0, 0, 1, 1);
	grid.attach(new Gtk.Label({ label: "R1C2" }), 1, 0, 1, 1);
	grid.attach(new Gtk.Label({ label: "R2C1" }), 0, 1, 1, 1);
	grid.attach(new Gtk.Label({ label: "R2C2" }), 1, 1, 1, 1);

	const stack = new Gtk.Stack({
		transition_type: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
		transition_duration: 180,
	});
	stack.add_titled(new Gtk.Label({ label: "First page" }), "page-1", "First");
	stack.add_titled(new Gtk.Label({ label: "Second page" }), "page-2", "Second");

	const stackSidebar = new Gtk.StackSidebar({ stack });
	const stackWrap = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
	stackWrap.append(stackSidebar);
	stackWrap.append(stack);
	stackWrap.set_size_request(340, 130);

	group.add(row("Box", box));
	group.add(row("Grid", grid));
	group.add(row("StackSidebar", stackWrap));
	return group;
}
