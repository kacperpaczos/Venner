# Entry parity report

Status: `in-progress`

## Scope

- GTK4 scene: `tools/gtk-reference/gtk4-gjs/widgets/entry.js`
- Libadwaita scene: `tools/gtk-reference/libadwaita-gjs/widgets/entry.js`
- Venner current target scene: `apps/dev/src/App.tsx`

## Current delta list

1. No dedicated Entry component API in Venner yet:
   - currently parity uses styled native input in dev app.
2. Focus and border behavior are still app-level CSS driven:
   - GTK/Adw use widget/theme state rendering.
3. Placeholder and disabled state styling not tokenized in a component-level contract.

## Next actions

- Add dedicated Venner Entry primitive/adaptor API.
- Tokenize entry focus, border, background, and disabled colors.
- Add controlled/uncontrolled examples to parity scene.
