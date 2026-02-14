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

export function buildMediaControlsScene() {
	const group = section("Media controls (Libadwaita)");

	const media = new Gtk.MediaControls({ hexpand: true });
	const video = new Gtk.Video({
		hexpand: true,
		vexpand: false,
		autoplay: false,
		loop: false,
	});
	media.set_media_stream(video.get_media_stream());

	const progress = new Gtk.Scale({
		orientation: Gtk.Orientation.HORIZONTAL,
		hexpand: true,
		draw_value: false,
	});
	progress.set_range(0, 100);
	progress.set_value(35);

	group.add(row("MediaControls", media));
	group.add(row("Progress reference", progress));
	return group;
}
