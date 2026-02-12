# Button parity report

Status: `in-progress`

## Scope

- GTK4 scene: `tools/gtk-reference/gtk4-gjs/widgets/button.js`
- Libadwaita scene: `tools/gtk-reference/libadwaita-gjs/widgets/button.js`
- Venner component: `packages/adapters/solid/src/Button.tsx`
- Venner styles: `packages/ui/src/styles/button.css`

## Current delta list

1. Variant semantics mismatch:
   - GTK/Adw reference uses default/suggested/destructive classes.
   - Venner currently exposes `primary/secondary/ghost/link`, which is not a 1:1 GNOME mapping.
2. Focus ring differs:
   - Venner hardcodes `outline: 2px` with token fallback; GTK focus visuals vary by theme state.
3. Active press animation:
   - Venner applies `transform: scale(0.98)`; GTK/Adw press feedback is theme-native and often no scale transform.
4. Disabled rendering:
   - Venner uses opacity reduction; GTK often uses theme-driven fg/bg changes without global opacity.

## Next actions

- Introduce GNOME-oriented variant mapping in theme layer (`default/suggested/destructive`).
- Move pressed/focus visuals to token-driven values and avoid hardcoded scale.
- Add explicit parity scene in dev app with the same state labels as reference apps.
