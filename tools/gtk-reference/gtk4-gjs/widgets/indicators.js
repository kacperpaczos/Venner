import Gtk from "gi://Gtk?version=4.0";

function section(title) {
	const frame = new Gtk.Frame({ label: title, hexpand: true });
	const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, margin_top: 12, margin_bottom: 12, margin_start: 12, margin_end: 12 });
	frame.set_child(box);
	return { frame, box };
}

export function buildIndicatorsScene() {
	const { frame, box } = section("Indicators (GTK4)");
	const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12 });

	const progress = new Gtk.ProgressBar({ fraction: 0.62, hexpand: true });
	progress.set_size_request(180, -1);
	const spinner = new Gtk.Spinner({ spinning: true });
	const scale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 100, 1);
	scale.set_value(45);
	scale.set_size_request(180, -1);
	const level = new Gtk.LevelBar({ min_value: 0, max_value: 100, value: 68 });
	level.set_size_request(160, -1);

	row.append(progress);
	row.append(spinner);
	row.append(scale);
	row.append(level);
	box.append(row);
	return frame;
}
