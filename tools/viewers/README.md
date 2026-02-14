# Viewers Workspace

Mini-viewery uruchamiane przez `apps/dev` (hub) lub ręcznie.

## Zawartość

- `gtk4-widget-viewer/` - GJS widget viewer dla GTK4.
- `adw-widget-viewer/` - GJS widget viewer dla Libadwaita.
- `venner-widget-viewer/` - GJS widget viewer dla profilu Venner.
- `gtk4-theme-viewer/` - GJS theme viewer dla GTK4.
- `adw-theme-viewer/` - GJS theme viewer dla Libadwaita.
- `venner-theme-viewer/` - GJS theme viewer dla profilu Venner.
- `manifests/` - fallback manifests (`widgets/`, `themes/`).

## Kontrakt sterowania

Viewery procesowe przyjmują JSON-lines po `stdin`:

- `ping`
- `show_widget_group { groupId }`
- `show_widget { widgetId, state? }`
- `list_widgets`
- `list_groups`
- `set_theme_preset { presetId }`
- `set_palette_override { tokens }`
- `get_theme_diagnostics`
- `shutdown`

Zwracają eventy JSON-lines po `stdout`:

- `ready`
- `state_changed`
- `theme_diagnostics`
- `error`
- `log`

## Uruchamianie ręczne

```bash
./scripts/run-viewer.sh gtk4-widget
./scripts/run-viewer.sh adw-widget
./scripts/run-viewer.sh venner-widget
./scripts/run-viewer.sh gtk4-theme
./scripts/run-viewer.sh adw-theme
./scripts/run-viewer.sh venner-theme
```
