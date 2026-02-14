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

export function buildTabsScene() {
	const { frame, box } = section("Tabs via StackSwitcher (GTK4)");

	const stack = new Gtk.Stack({
		transition_type: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
		vexpand: true,
		hexpand: true,
	});
	stack.add_titled(new Gtk.Label({ label: "General content" }), "general", "General");
	stack.add_titled(new Gtk.Label({ label: "Appearance content" }), "appearance", "Appearance");
	stack.add_titled(new Gtk.Label({ label: "Advanced content" }), "advanced", "Advanced");

	const switcher = new Gtk.StackSwitcher({ stack });
	box.append(switcher);
	box.append(stack);
	return frame;
}
