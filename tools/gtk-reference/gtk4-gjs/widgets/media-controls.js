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

export function buildMediaControlsScene() {
	const { frame, box } = section("Media controls (GTK4)");

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

	box.append(media);
	box.append(progress);
	return frame;
}
