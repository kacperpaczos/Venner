# 06. Mapa Drogowa MVP: Venner Widget Framework

Fazy implementacji frameworka agnostycznego — widgety native-feeling dla Tauri. Runtime: **Bun**.

---

## STAN FAKTYCZNY (Aktualizacja: 2026-02-11)

**Gałąź**: `harness`  
**Stan**: **MVP Faza 0–1 zrealizowana** — działająca demonstracja end-to-end.

### Zaimplementowane

| Komponent | Status | Uwagi |
|-----------|--------|-------|
| **Monorepo structure** | ✅ | Bun workspaces + Cargo workspace |
| **crates/venner_core** | ✅ | theme/, state/, ipc — parser GTK3/GTK4, resolver, monitor, gsettings |
| **packages/core** | ✅ | invoke, listen, VennerStore, AppState |
| **packages/themes/gnome** | ✅ | Loader: get_gtk_theme, theme:changed, injectTokens() |
| **packages/primitives** | ✅ | button.machine.ts, switch.machine.ts (Zag.js, WAI-ARIA) |
| **packages/adapters/solid** | ✅ | Button.tsx, hooks (useStore) |
| **packages/ui** | ✅ | tokens.css, button.css (--venner-* design tokens) |
| **apps/dev** | ✅ | Tauri + SolidJS, używa @venner/*, Venner Button |
| **Specta codegen** | ✅ | derive Specta, serde_json, typy TS |
| **Zag.js integration** | ✅ | button.machine, switch.machine |
| **resources/themes** | ✅ | default-gtk3, default-gtk4, mint-l-dark-sand-gtk3 |

### Do zrobienia (Faza 2+)

1. **Switch** – pełna integracja UI + adapter (switch.css, Switch.tsx)
2. **ListView, Dialog, Window Machine** – kolejne primitives
3. **KDE theme loader** – placeholder
4. **Performance benchmarks, pixel-perfect tests**

### Jak budować kolejne części aplikacji (na bazie aktualnego wzorca)

Każdy nowy widget realizujemy jako 5 kroków:

1. **Machine** (`packages/primitives/src/<widget>.machine.ts`)  
   Definiuje stany i eventy (`POINTER_*`, `KEY_*`, `FOCUS/BLUR`), bez zależności od Solid/React.
2. **Connect** (`packages/primitives/src/<widget>.connect.ts`)  
   Wystawia API renderowania: `rootProps`, `state`, opcjonalnie `labelProps`/`itemProps`.
3. **Adapter** (`packages/adapters/solid/src/<Widget>.tsx`)  
   Łączy `useMachine(machine, props)` z `connect(service)`.
4. **UI CSS** (`packages/ui/src/styles/<widget>.css`)  
   Wyłącznie `data-*` + `--venner-*`, zero hardcoded kolorów systemowych.
5. **Dev app** (`apps/dev/src/App.tsx`)  
   Test zachowania: mysz, klawiatura (Enter/Space), disabled, focus, hover.

### Definition of Done dla fazy 2

- `Switch` ma kompletny zestaw: `switch.machine.ts`, `switch.connect.ts`, `Switch.tsx`, `switch.css`.
- `ListView` i `Dialog` mają minimum: machine + connect + adapter + demo w `apps/dev`.
- Wszystkie nowe widgety przechodzą `bun run build` i nie psują istniejących komponentów.
- Dla stanów trwałych (`checked`, `selected`, `value`) aktualizacja idzie przez Rust Store (`dispatch`), nie przez lokalny state adaptera.

---

## Faza 0: Infrastruktura (Tydzień 1)

**Cel**: Monorepo + tooling + CI.

**Rozwiązanie w Frameworku**:
*   **Scaffold monorepo**: Bun workspaces + Turborepo pipeline.
*   **Pakiety config**: `@venner/typescript-config`, `@venner/eslint-config`.
*   **`@venner/core`**: Abstrakcja nad Tauri API, `UserDirs` (Rust crate `directories`), detekcja systemu.
*   **`apps/dev`**: Minimalna aplikacja Tauri + Vite + SolidJS.

## Faza 1: Theme Extraction (Tydzień 2-3)

**Cel**: Mechanizm ekstrakcji motywu systemowego — moduł `@venner/themes/gnome`.

**Rozwiązanie w Frameworku**:
*   Implementacja **parsera GTK CSS** w Rust (wykrywanie `@define-color`, `alpha()`, `mix()`).
*   Odczyt `gsettings get org.gnome.desktop.interface gtk-theme`.
*   Transpilacja na zmienne `--venner-*` i wstrzyknięcie do WebView.
*   **API**: `VennerApp::builder().with_system_theme().build()`.
*   Fundament pod `@venner/themes/kde` (KDE Plasma).

## Faza 2: Primitives — Headless Widgets (Tydzień 3-5)

**Cel**: Agnostyczne maszyny stanów widgetów — `@venner/primitives`.

**Rozwiązanie w Frameworku**:
*   **Button, Switch, Toggle**: Podstawowe kontrolki z pełnym WAI-ARIA.
*   **Window Machine**: `hidden → opening → visible → closing → hidden`.
*   **Dialog, Popover**: Modalne i nie-modalne overlaye.
*   **ListView**: Wirtualizowana lista z nawigacją klawiaturą.
*   **Focus Ring Manager**: Detekcja trybu nawigacji (Mouse vs Tab).
*   Wszystko **bez frameworka UI** — czyste TS + Zag.js.

## Faza 3: UI + SolidJS Adapter (Tydzień 5-6)

**Cel**: Visual Shell (`@venner/ui`) + SolidJS bindingi (`@venner/solid`).

**Rozwiązanie w Frameworku**:
*   `@venner/ui`: Minimalne szablony HTML/CSS korzystające z `--venner-*` tokenów.
*   `@venner/solid`: Adapter łączący maszyny Zag.js z reaktywnością SolidJS.
*   Komponenty: `Button`, `Switch`, `HeaderBar`, `ListView`, `Dialog`, `StatusPage`, `Window`.
*   **Example App**: `apps/dev` demonstrujący pełny przepływ framework → widgety → motyw systemowy.

## Faza 4: Stabilizacja API + DX (Tydzień 7)

**Cel**: Developer Experience. Kod frameworka musi być łatwy w użyciu.

**Rozwiązanie w Frameworku**:
*   **Fasadowy re-export**: `@venner/venner` eksportuje gotowe komponenty i hooki.
*   **Dokumentacja**: `typedoc` dla TS, `rustdoc` dla modułów Rust.
*   **Performance Benchmarks**: CI porównujący czas inicjalizacji 100/1000 widgetów.
*   **Pixel-Perfect Tests**: Screenshoty widgetów vs natywne odpowiedniki.
