# 07. Plan Architektoniczny: Kompozycja Widgetów

Specyfikacja budowy widgetów opartych na modelu "Headless Machines" (`@venner/primitives`) + "Visual Shell" (`@venner/ui`) + "Framework Adapter" (`@venner/solid` z `packages/adapters/solid`).

## 1. Hierarchia Komponentów (Widget Tree)

Widgety Venner odtwarzają strukturę natywnych okien:

```text
Window (Native Host — Tauri)
 └── ApplicationWindow (Shell)
       ├── HeaderBar (Window Controls + Title)
       ├── AdaptiveLayout (Responsive Container)
       │     ├── Box (Sidebar)
       │     │     └── ListView (Virtual Scroll)
       │     └── Box (Content)
       │           └── StatusPage (Empty State)
       └── Overlay (Toast/Dialogs)
```

## 2. Warstwa Platform (`@venner/core`)

Aby zachować native-feeling, warstwa platformowa izoluje niskopoziomowe zachowania.

### 2.1. Focus Ring Management
**Problem**: Przeglądarka rysuje własny "outline". Natywne toolkit-y rysują focus ring w specyficzny sposób.
**Rozwiązanie**:
*   `@venner/primitives` — `Focusable` machine zarządzająca stanem `is-focus`.
*   `@venner/core` — globalny listener klawiatury wykrywający tryb nawigacji (Mouse vs Tab).
*   Klasa `.venner-has-focus` aplikowana warunkowo, co pozwala motywowi narysować poprawny ring.

### 2.2. Geometry Management
**Problem**: Natywne toolkity używają "Size Groups" do synchronizacji rozmiarów widgetów.
**Rozwiązanie**:
*   Użycie CSS Grid wszędzie gdzie się da.
*   Dla SizeGroup: Implementacja w `@venner/primitives` używająca `ResizeObserver`.

## 3. Przepływ Danych (Framework-Agnostic)

Maszyny stanów Zag.js mapowane na adaptery per framework:

| Widget Event | Zag.js Machine | SolidJS Adapter | React Adapter (future) |
| :--- | :--- | :--- | :--- |
| `clicked` | `api.click()` | `onClick` | `onClick` |
| `property changed` | `api.state` | `createEffect(() => ...)` | `useEffect(() => ...)` |
| `activate (Enter)` | `api.onKeyDown` | `onKeyDown` | `onKeyDown` |

**Maszyna Stanu (framework-agnostic)**:
Widgety w `@venner/primitives` (np. `Switch`) to maszyny stanów.
Obsługują stany przejściowe (`hover`, `active`, `checked`), które CSS mapuje selektorami.

```typescript
// @venner/primitives/switch.machine.ts
// ZERO zależności od frameworka UI
import { createMachine } from "@zag-js/core";

export const switchMachine = createMachine({
    context: { checked: false, disabled: false },
    states: {
        idle: { on: { TOGGLE: "toggling" } },
        toggling: {
            after: { 150: "idle" },
            entry: ["toggleValue"]
        }
    }
});
```

```typescript
// @venner/solid/Switch.tsx — SolidJS adapter
import { useMachine } from "@zag-js/solid";
import { switchMachine, switchConnect } from "@venner/primitives";
import "@venner/ui/styles/switch.css";

export function Switch(props) {
    const service = useMachine(switchMachine, props);
    const api = switchConnect(service);
    return <button {...api.rootProps} class="venner-switch" />;
}
```

### 3.1. Przepis na budowę kolejnych widgetów

Wniosek z implementacji `Button`: dla nowych komponentów (`Switch`, `ListView`, `Dialog`, `Window`) stosujemy ten sam pipeline:

1. `packages/primitives/src/<widget>.machine.ts`  
   Machine Zag.js (framework-agnostic), tylko logika stanu i eventów.
2. `packages/primitives/src/<widget>.connect.ts`  
   Własny connector mapujący `service` do API renderowania (`rootProps`, `labelProps`, `state`).
3. `packages/adapters/solid/src/<Widget>.tsx`  
   `useMachine(machine, props)` + `connect(service)`, bez dublowania state lokalnym `createSignal`.
4. `packages/ui/src/styles/<widget>.css`  
   Stylowanie przez `data-*` + tokeny `--venner-*`.
5. `apps/dev/src/App.tsx`  
   Scenariusz integracyjny: click, Enter/Space, focus/blur, hover, disabled.

### 3.2. Zasady kompatybilności Zag.js

- Nie zakładamy istnienia gotowego connectora dla każdego widgetu (`@zag-js/<widget>`).  
  Jeśli brak connectora, implementujemy własny `<widget>.connect.ts` w `primitives`.
- Adapter Solid traktuje `useMachine` jako źródło `service`, a nie tuple `[state, send]`.
- Kontrakt state modelu pozostaje bez zmian: trwały stan modelu idzie przez Rust Store (`dispatch()`), a Zag.js obsługuje stany przejściowe UI.

## 4. Native Overrides (Tauri API)

Nie wszystko symulujemy w DOM. Niektóre rzeczy muszą być 100% natywne:

*   **Menu Kontekstowe**: Natywne `tauri::menu` (macOS/Windows) lub custom HTML (Linux), aby pasować do systemu.
*   **Dialogi Plików**: Zawsze natywne (`tauri::dialog`). Nie rysujemy własnego FileChooser.
*   **Tray/System Notifications**: Natywne API systemu operacyjnego.

## 5. Wydajność (Performance Budget)

| Metryka | Budget | Pomiar |
| :--- | :--- | :--- |
| Init 1 widget | < 0.5ms | `performance.now()` |
| Init 100 widgets | < 16ms (1 frame) | CI benchmark |
| Memory per widget | < 2KB | Chrome DevTools |
| First Contentful Paint | < 200ms | Lighthouse |

Wydajność jest **fundamentem** — każda warstwa abstrakcji musi być mierzalnie lekka.
