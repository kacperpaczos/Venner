# GTK Parity Workflow

This document is the operational checklist for comparing Venner components against GTK4 and Libadwaita references.

## Per-widget process

1. Implement or update scenes in:
   - `gtk4-gjs/widgets/<widget>.js`
   - `libadwaita-gjs/widgets/<widget>.js`
2. Prepare matching Venner scene in `apps/dev`.
3. Review states manually (pixel-focused):
   - default
   - hover
   - active/pressed
   - focus-visible
   - disabled
   - selected/checked (if applicable)
4. Record differences in `reports/<widget>-parity.md`.
5. Update `parity-matrix.md` status.

## Acceptance criteria for `parity-ready`

- Geometry matches within practical desktop tolerance.
- Typography and spacing are visually aligned.
- Interaction states map correctly (focus/hover/active/disabled).
- No critical API mismatch for component usage.
- Delta report has no open blockers.

## Initial batch scope

- Button
- Entry
- Switch
- Tabs
