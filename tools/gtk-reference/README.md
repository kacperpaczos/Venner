# GTK Reference Workspace

This workspace defines the parity methodology between Venner components and native GNOME widget baselines.

## Structure

- `gtk4-gjs/` - pure GTK4 reference app (GJS).
- `libadwaita-gjs/` - Libadwaita reference app (GJS).
- `parity-matrix.md` - status board per widget.
- `workflow.md` - repeatable parity process and acceptance criteria.
- `reports/` - per-widget delta reports and iteration notes.

## One-time prerequisites

- `gjs`
- `gtk4`
- `libadwaita-1`

Example (Debian/Ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y gjs gir1.2-gtk-4.0 gir1.2-adw-1
```

## Run reference apps

```bash
./scripts/run-gtk-ref.sh
./scripts/run-gtk-ref.sh --gtk4
./scripts/run-gtk-ref.sh --libadwaita
```

Or directly:

```bash
gjs -m tools/gtk-reference/gtk4-gjs/app.js
gjs -m tools/gtk-reference/libadwaita-gjs/app.js
```

## Parity workflow (manual pixel-perfect review)

1. Open GTK4 and Libadwaita reference scenes for one widget.
2. Open equivalent Venner scene in `apps/dev`.
3. Compare states:
   - default, hover, active, focus-visible, disabled,
   - selected/checked when relevant.
4. Fill delta report in `reports/<widget>-parity.md`.
5. Update `parity-matrix.md` status.

## Quality checklist

- Geometry: size, spacing, border width, radius.
- Typography: font size, weight, line-height.
- Colors and contrast.
- Interaction behavior and focus ring.
- API parity (props/state/events).
