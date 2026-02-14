# GTK Reference Workspace

This directory provides GTK reference applications and one canonical implementation report.

## Canonical Human Report
- `tools/gtk-reference/gtk-implementation-report.md`

## Runtime Metadata (Machine-Readable)
- `tools/gtk-reference/source-mapping.summary.json`

`source-mapping.summary.json` is consumed by `apps/dev` (`load_gtk_reference_summary`) and is not the human-facing report.

## Reference Apps (Unchanged)
- `tools/gtk-reference/gtk4-gjs/`
- `tools/gtk-reference/libadwaita-gjs/`

## Run Reference Apps
```bash
./scripts/run-gtk-ref.sh
./scripts/run-gtk-ref.sh --gtk4
./scripts/run-gtk-ref.sh --libadwaita
./scripts/run-gtk-ref.sh --both
```
