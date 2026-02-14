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

export function buildContainersScene() {
	const { frame, box } = section("Container widgets (GTK4)");

	const top = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
	top.append(new Gtk.Button({ label: "Start" }));
	top.append(new Gtk.Button({ label: "Center" }));
	top.append(new Gtk.Button({ label: "End" }));

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
	stackWrap.set_size_request(-1, 140);

	box.append(top);
	box.append(grid);
	box.append(stackWrap);
	return frame;
}
