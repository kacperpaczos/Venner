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

export function buildIndicatorsScene() {
	const group = section("Indicators (Libadwaita)");
	const progress = new Gtk.ProgressBar({ fraction: 0.62, hexpand: true });
	progress.set_size_request(180, -1);
	const spinner = new Gtk.Spinner({ spinning: true });
	const scale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 100, 1);
	scale.set_value(45);
	scale.set_size_request(160, -1);
	const level = new Gtk.LevelBar({ min_value: 0, max_value: 100, value: 68 });
	level.set_size_request(160, -1);
	group.add(row("Progress", progress));
	group.add(row("Spinner", spinner));
	group.add(row("Scale", scale));
	group.add(row("Level", level));
	return group;
}
