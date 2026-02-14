# GTK Implementation Report (Canonical)

## 1. Purpose and Scope
This document is the canonical, human-facing implementation report for GTK4 parity in Venner.

What is measured:
- semantic parity with GTK4 behavior and interaction models,
- implementation maturity in Venner primitives/adapters/styles/viewers,
- known deltas where web platform constraints prevent native 1:1 behavior.

What is explicitly out of scope:
- automated pixel-perfect comparison,
- native GTK renderer equivalence inside the web runtime.

Audience:
- engineers implementing GTK parity,
- reviewers validating implementation quality and residual risk,
- maintainers of `apps/dev` and viewer tooling.

## 2. Baseline and Sources
### 2.1 Baseline Freeze
- GTK version baseline: `4.20.3`
- Source tag: `upstream/4.20.3`
- Source commit SHA: `10c07849e1b1750158eeef32ad1389f1f35f48dd`
- Baseline date: `2026-02-14`

### 2.2 Source Policy
All behavior claims must be evidence-backed by:
1. GTK API reference (`docs.gtk.org/gtk4`), and
2. GTK source location (`gtk/<file>.c`) at the frozen baseline.

Primary references:
- GTK API docs: `https://docs.gtk.org/gtk4/`
- GTK widget gallery: `https://docs.gtk.org/gtk4/visual_index.html`
- GTK source repository: `https://gitlab.gnome.org/GNOME/gtk/`
- Pinned source mirror: `https://chromium.googlesource.com/external/github.com/GNOME/gtk/+/refs/tags/upstream/4.20.3`

## 3. Methodology
Evaluation dimensions:
- API parity (component surface and semantic props),
- FSM/state handling (primitives where applicable),
- interaction model (mouse, keyboard, focus, disabled, selection),
- style parity via token-driven pipeline (`--venner-*`),
- viewer coverage (manual parity scenes and launchability),
- documented delta vs GTK for non-1:1 mappings.

Theme model note:
- Venner uses theme token extraction and CSS token mapping, not native GTK CSS rendering in web components.

## 4. Quality Scoring Model
### 4.1 Levels
- `L3`: adapter + FSM/primitives + tokenized styles.
- `L2`: adapter + tokenized styles; no dedicated primitives FSM (or foundation/helper role).
- `L1`: visual/partial implementation only.

### 4.2 Done Gate
A class is considered implementation-complete for current scope when:
1. adapter exists and is consumable,
2. FSM exists, or documented semantic exception is accepted,
3. styles exist for relevant states,
4. viewer coverage exists (or documented foundation exception),
5. delta vs GTK is explicitly documented.

## 5. Canonical Widget Inventory
Legend:
- `Primitive/FSM`: `yes`, `no`, or `foundation/helper`.
- `Viewer`: `yes`, `partial`, or `foundation`.

| GTK Class | Status | Primitive/FSM | Adapter Path | Style Path | Viewer | Delta vs GTK | Evidence |
|---|---|---|---|---|---|---|---|
| AboutDialog | L2 | no | `packages/adapters/solid/src/AboutDialog.tsx` | `packages/ui/src/styles/dialog.css` | partial | semantic modal wrapper | Docs: `class.AboutDialog` ; GTK: `gtk/gtkaboutdialog.c` |
| ApplicationWindow | L2 | no | `packages/adapters/solid/src/ApplicationWindow.tsx` | `packages/ui/src/styles/application-window.css` | partial | semantic shell instead of native toplevel | Docs: `class.ApplicationWindow` ; GTK: `gtk/gtkapplicationwindow.c` |
| Dialog | L2 | no | `packages/adapters/solid/src/Dialog.tsx` | `packages/ui/src/styles/dialog.css` | partial | modal overlay/action slots | Docs: `class.Dialog` ; GTK: `gtk/gtkdialog.c` |
| MessageDialog | L2 | no | `packages/adapters/solid/src/MessageDialog.tsx` | `packages/ui/src/styles/dialog.css` | partial | message-kind semantic mapping | Docs: `class.MessageDialog` ; GTK: `gtk/gtkmessagedialog.c` |
| Button | L3 | yes | `packages/adapters/solid/src/Button.tsx` | `packages/ui/src/styles/button.css` | yes | semantic parity, token-driven visuals | Docs: `class.Button` ; GTK: `gtk/gtkbutton.c` |
| CheckButton | L3 | yes | `packages/adapters/solid/src/CheckButton.tsx` | `packages/ui/src/styles/check-button.css` | yes | semantic parity | Docs: `class.CheckButton` ; GTK: `gtk/gtkcheckbutton.c` |
| ToggleButton | L3 | yes | `packages/adapters/solid/src/ToggleButton.tsx` | `packages/ui/src/styles/toggle-button.css` | yes | semantic parity | Docs: `class.ToggleButton` ; GTK: `gtk/gtktogglebutton.c` |
| MenuButton | L3 | yes | `packages/adapters/solid/src/MenuButton.tsx` | `packages/ui/src/styles/menu-button.css` | yes | simplified popover/menu internals | Docs: `class.MenuButton` ; GTK: `gtk/gtkmenubutton.c` |
| LinkButton | L3 | yes | `packages/adapters/solid/src/LinkButton.tsx` | `packages/ui/src/styles/link-button.css` | yes | web anchor semantics | Docs: `class.LinkButton` ; GTK: `gtk/gtklinkbutton.c` |
| Entry | L2 | no | `packages/adapters/solid/src/Entry.tsx` | `packages/ui/src/styles/entry.css` | partial | semantic input without dedicated primitives machine | Docs: `class.Entry` ; GTK: `gtk/gtkentry.c` |
| SearchEntry | L3 | yes | `packages/adapters/solid/src/SearchEntry.tsx` | `packages/ui/src/styles/search-entry.css` | yes | semantic parity | Docs: `class.SearchEntry` ; GTK: `gtk/gtksearchentry.c` |
| PasswordEntry | L3 | yes | `packages/adapters/solid/src/PasswordEntry.tsx` | `packages/ui/src/styles/password-entry.css` | yes | simplified reveal UX | Docs: `class.PasswordEntry` ; GTK: `gtk/gtkpasswordentry.c` |
| SpinButton | L3 | yes | `packages/adapters/solid/src/SpinButton.tsx` | `packages/ui/src/styles/spin-button.css` | yes | web input/buttons composition | Docs: `class.SpinButton` ; GTK: `gtk/gtkspinbutton.c` |
| DropDown | L3 | yes | `packages/adapters/solid/src/DropDown.tsx` | `packages/ui/src/styles/dropdown.css` | partial | native `<select>` popup renderer-dependent | Docs: `class.DropDown` ; GTK: `gtk/gtkdropdown.c` |
| Switch | L2 | no | `packages/adapters/solid/src/Switch.tsx` | `packages/ui/src/styles/switch.css` | yes | local state model, no primitives machine | Docs: `class.Switch` ; GTK: `gtk/gtkswitch.c` |
| ProgressBar | L3 | yes | `packages/adapters/solid/src/ProgressBar.tsx` | `packages/ui/src/styles/progress-bar.css` | yes | semantic parity | Docs: `class.ProgressBar` ; GTK: `gtk/gtkprogressbar.c` |
| Spinner | L3 | yes | `packages/adapters/solid/src/Spinner.tsx` | `packages/ui/src/styles/spinner.css` | yes | CSS-based spinner implementation | Docs: `class.Spinner` ; GTK: `gtk/gtkspinner.c` |
| LevelBar | L3 | yes | `packages/adapters/solid/src/LevelBar.tsx` | `packages/ui/src/styles/level-bar.css` | yes | simplified range visuals | Docs: `class.LevelBar` ; GTK: `gtk/gtklevelbar.c` |
| Scale | L3 | yes | `packages/adapters/solid/src/Scale.tsx` | `packages/ui/src/styles/scale.css` | yes | range input semantic mapping | Docs: `class.Scale` ; GTK: `gtk/gtkscale.c` |
| ListView | L3 | yes | `packages/adapters/solid/src/ListView.tsx` | `packages/ui/src/styles/list-view.css` | yes | simplified model/selection vs native list model | Docs: `class.ListView` ; GTK: `gtk/gtklistview.c` |
| GridView | L3 | yes | `packages/adapters/solid/src/GridView.tsx` | `packages/ui/src/styles/grid-view.css` | partial | parity scenarios still open | Docs: `class.GridView` ; GTK: `gtk/gtkgridview.c` |
| ColumnView | L3 | yes | `packages/adapters/solid/src/ColumnView.tsx` | `packages/ui/src/styles/column-view.css` | partial | parity scenarios still open | Docs: `class.ColumnView` ; GTK: `gtk/gtkcolumnview.c` |
| ListBox | L3 | yes | `packages/adapters/solid/src/ListBox.tsx` | `packages/ui/src/styles/list-box.css` | partial | parity scenarios still open | Docs: `class.ListBox` ; GTK: `gtk/gtklistbox.c` |
| ListBoxRow | L3 | foundation/helper | `packages/adapters/solid/src/ListBox.tsx` | `packages/ui/src/styles/list-box.css` | partial | implemented via ListBox composition | Docs: `class.ListBoxRow` ; GTK: `gtk/gtklistboxrow.c` |
| Box | L2 | no | `packages/adapters/solid/src/Box.tsx` | `packages/ui/src/styles/box.css` | partial | flex semantic mapping | Docs: `class.Box` ; GTK: `gtk/gtkbox.c` |
| Grid | L2 | no | `packages/adapters/solid/src/Grid.tsx` | `packages/ui/src/styles/grid.css` | partial | CSS grid semantic mapping | Docs: `class.Grid` ; GTK: `gtk/gtkgrid.c` |
| Paned | L3 | yes | `packages/adapters/solid/src/Paned.tsx` | `packages/ui/src/styles/paned.css` | yes | simplified split handle behavior | Docs: `class.Paned` ; GTK: `gtk/gtkpaned.c` |
| Stack | L2 | no | `packages/adapters/solid/src/Tabs.tsx` | `packages/ui/src/styles/tabs.css` | yes | represented by tabs semantic abstraction | Docs: `class.Stack` ; GTK: `gtk/gtkstack.c` |
| StackSidebar | L2 | no | `packages/adapters/solid/src/StackSidebar.tsx` | `packages/ui/src/styles/stack-sidebar.css` | partial | simplified geometry and navigation model | Docs: `class.StackSidebar` ; GTK: `gtk/gtkstacksidebar.c` |
| StackSwitcher | L2 | no | `packages/adapters/solid/src/Tabs.tsx` | `packages/ui/src/styles/tabs.css` | yes | represented by tabs switcher behavior | Docs: `class.StackSwitcher` ; GTK: `gtk/gtkstackswitcher.c` |
| Image | L2 | no | `packages/adapters/solid/src/Image.tsx` | `packages/ui/src/styles/image.css` | partial | web `<img>` wrapper | Docs: `class.Image` ; GTK: `gtk/gtkimage.c` |
| Picture | L2 | no | `packages/adapters/solid/src/Picture.tsx` | `packages/ui/src/styles/picture.css` | partial | web `<picture>` wrapper | Docs: `class.Picture` ; GTK: `gtk/gtkpicture.c` |
| DrawingArea | L3 | yes | `packages/adapters/solid/src/DrawingArea.tsx` | `packages/ui/src/styles/drawing-area.css` | partial | parity scenarios still open | Docs: `class.DrawingArea` ; GTK: `gtk/gtkdrawingarea.c` |
| MediaControls | L2 | no | `packages/adapters/solid/src/MediaControls.tsx` | `packages/ui/src/styles/media-controls.css` | partial | semantic play/seek/volume without native media pipeline | Docs: `class.MediaControls` ; GTK: `gtk/gtkmediacontrols.c` |
| Label | L2 | no | `packages/adapters/solid/src/Label.tsx` | `packages/ui/src/styles/label.css` | partial | semantic label wrapper | Docs: `class.Label` ; GTK: `gtk/gtklabel.c` |
| Overlay | L2 | no | `packages/adapters/solid/src/Overlay.tsx` | `packages/ui/src/styles/overlay.css` | partial | absolute-position layered overlay mapping | Docs: `class.Overlay` ; GTK: `gtk/gtkoverlay.c` |
| ScrolledWindow | L2 | no | `packages/adapters/solid/src/ScrolledWindow.tsx` | `packages/ui/src/styles/scrolled-window.css` | partial | overflow container semantic mapping | Docs: `class.ScrolledWindow` ; GTK: `gtk/gtkscrolledwindow.c` |
| Expander | L3 | yes | `packages/adapters/solid/src/Expander.tsx` | `packages/ui/src/styles/expander.css` | yes | semantic parity | Docs: `class.Expander` ; GTK: `gtk/gtkexpander.c` |
| Popover | L3 | yes | `packages/adapters/solid/src/Popover.tsx` | `packages/ui/src/styles/popover.css` | yes | simplified placement/geometry | Docs: `class.Popover` ; GTK: `gtk/gtkpopover.c` |
| HeaderBar | L3 | yes | `packages/adapters/solid/src/HeaderBar.tsx` | `packages/ui/src/styles/header-bar.css` | partial | layout semantics only in current scope | Docs: `class.HeaderBar` ; GTK: `gtk/gtkheaderbar.c` |
| ActionBar | L3 | yes | `packages/adapters/solid/src/ActionBar.tsx` | `packages/ui/src/styles/action-bar.css` | partial | parity scenarios still open | Docs: `class.ActionBar` ; GTK: `gtk/gtkactionbar.c` |
| CenterBox | L3 | yes | `packages/adapters/solid/src/CenterBox.tsx` | `packages/ui/src/styles/center-box.css` | partial | parity scenarios still open | Docs: `class.CenterBox` ; GTK: `gtk/gtkcenterbox.c` |
| FlowBox | L3 | yes | `packages/adapters/solid/src/FlowBox.tsx` | `packages/ui/src/styles/flow-box.css` | partial | parity scenarios still open | Docs: `class.FlowBox` ; GTK: `gtk/gtkflowbox.c` |
| SplitButton | L3 | yes | `packages/adapters/solid/src/SplitButton.tsx` | `packages/ui/src/styles/split-button.css` | partial | parity scenarios still open | Docs: `class.SplitButton` ; GTK: `gtk/gtksplitbutton.c` |
| TextView | L3 | yes | `packages/adapters/solid/src/TextView.tsx` | `packages/ui/src/styles/text-view.css` | partial | parity scenarios still open | Docs: `class.TextView` ; GTK: `gtk/gtktextview.c` |
| Video | L3 | yes | `packages/adapters/solid/src/VideoView.tsx` | `packages/ui/src/styles/video-view.css` | partial | parity scenarios still open | Docs: `class.Video` ; GTK: `gtk/gtkvideo.c` |
| Widget | L2 | foundation/helper | `packages/adapters/solid/src/Widget.tsx` | `packages/ui/src/styles/widget.css` | foundation | base semantic wrapper for adapter states | Docs: `class.Widget` ; GTK: `gtk/gtkwidget.c` |
| Adjustment | L2 | foundation/helper | `packages/adapters/solid/src/Adjustment.ts` | N/A | foundation | helper clamp/step model for range-like adapters | Docs: `class.Adjustment` ; GTK: `gtk/gtkadjustment.c` |
| Range | L3 | yes | `packages/adapters/solid/src/Scale.tsx` | `packages/ui/src/styles/scale.css` | yes | represented via Scale semantic model | Docs: `class.Range` ; GTK: `gtk/gtkrange.c` |

## 6. Aggregate Quality Summary
Coverage totals:
- `L3`: `30`
- `L2`: `19`
- `L1`: `0`

Implementation profile:
- core interactive components are predominantly `L3`,
- foundation and semantic web mappings are captured at `L2`,
- no remaining `L1` or `N/A` in current scope model.

Primary risk areas:
- items marked `partial` in viewer coverage still require manual parity closure,
- widgets relying on native web controls may vary by runtime renderer,
- advanced GTK geometry/layout nuances are intentionally simplified in web mappings.

## 7. Per-Domain Analysis
### 7.1 Input and Form Controls
Strengths:
- broad `L3` coverage (`SearchEntry`, `PasswordEntry`, `SpinButton`, `DropDown`).
- consistent tokenized styling and event semantics.

Weaknesses:
- `Entry` is `L2` without dedicated primitives FSM.
- `DropDown` popup behavior remains renderer-dependent.

### 7.2 Selection and Buttons
Strengths:
- `Button`, `CheckButton`, `ToggleButton`, `MenuButton`, `LinkButton` at `L3`.
- clear state modeling and consistent styles.

Weaknesses:
- menu/popover internals are simplified vs native GTK behavior.

### 7.3 Layout and Containers
Strengths:
- `Paned`, `Expander`, `Popover` at `L3`.
- semantic coverage for `Box`, `Grid`, `Stack`, `StackSidebar`.

Weaknesses:
- some components are abstracted (`Stack`/`StackSwitcher` via tabs proxy).
- complex geometry parity remains partial in manual review.

### 7.4 Lists and Data Views
Strengths:
- `ListView`, `ListBox`, `GridView`, `ColumnView` have adapter + primitives coverage.

Weaknesses:
- viewer parity for complex list/grid/column interactions is still partial.

### 7.5 Display and Media
Strengths:
- semantic wrappers for `Image`, `Picture`, `Label`, `MediaControls` implemented.
- `Video` and `DrawingArea` have dedicated adapters and primitives coverage.

Weaknesses:
- media pipeline behavior is simplified in web environment.
- visual parity for display/media still requires manual closure.

### 7.6 Dialogs and Windowing
Strengths:
- dialog family and application shell are implemented as semantic adapters.
- foundation abstractions (`Widget`, `Adjustment`) are explicit and reusable.

Weaknesses:
- native GTK top-level window management/chrome behavior is not replicated.

## 8. Residual Deltas and Engineering Notes
Accepted web-platform deltas:
- native GTK popup/window semantics replaced by semantic web overlays/dialogs,
- some abstract GTK classes are represented through semantic proxies,
- renderer-specific behavior exists for native HTML controls (`<select>`),
- geometry and animation are intentionally simplified where GTK-native behavior is not portable.

Known limitations are implementation decisions, not undocumented gaps.

## 9. Traceability Appendix
### 9.1 Key Code Locations
- adapters: `packages/adapters/solid/src/`
- primitives/FSM: `packages/primitives/src/`
- styles: `packages/ui/src/styles/`
- viewer runners: `tools/viewers/*-widget-viewer/app.js`
- viewer manifests: `tools/viewers/manifests/widgets/*.json`
- dev orchestrator UI: `apps/dev/src/HubPanel.tsx`
- dev hub runtime bridge: `apps/dev/src/viewerHub.ts`
- tauri commands: `apps/dev/src-tauri/src/lib.rs`

### 9.2 Derived Runtime Artifact
Machine-readable metadata consumed by `apps/dev` is intentionally separate:
- `tools/gtk-reference/source-mapping.summary.json`

This JSON is a derived artifact and must remain schema-compatible with `load_gtk_reference_summary` consumer logic.

## Glossary
- **Canonical report**: single source of truth for human-facing GTK implementation status.
- **Derived artifact**: machine-readable summary generated/maintained for runtime consumers.
- **Semantic parity**: behaviorally equivalent intent without requiring native renderer identity.
- **Delta vs GTK**: documented, accepted difference between GTK native behavior and Venner web implementation.
