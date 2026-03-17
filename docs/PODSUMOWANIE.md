# Venner Framework v2.0

Native-feeling desktop apps, built with the Web.

**Nazwa projektu**: Venner (nowy framework) | Visage (legacy codebase do analizy)  
**Runtime**: Bun (domyślny, zastępuje Node.js)  
**Backend**: Tauri v2 (Rust)  
**Architektura**: Monorepo (Bun workspaces + Turborepo + Cargo)

---

## STAN FAKTYCZNY PROJEKTU (2026-02-12)

**Gałąź**: `harness` | **Status**: MVP Faza 0–1 + SSoT Import/Export/Rehydrate

### Zaimplementowane ✅
- Struktura monorepo (Bun + Cargo workspaces, Turborepo)
- **crates/venner_core** – moduły: `theme/` (parser GTK3/4, resolver, path, monitor), `state/`, `ipc`
- Parser GTK CSS – `@define-color`, shade(), alpha(), mapowanie na `--venner-*`
- Theme resolver – gsettings, XDG, color-scheme, desktop detection (GNOME/Cinnamon)
- resources/themes – `default-gtk3`, `default-gtk4`, `mint-l-dark-sand-gtk3` (VENNER_THEMES_DIR, VENNER_DEV_THEME)
- Theme monitor – gsettings monitor → event `theme:changed`
- **packages/core** – invoke, listen, store projection, typy
- **packages/themes/gnome** – `getThemeTokens()`, `injectTokens()`, `listen("theme:changed")`
- **packages/ui** – `tokens.css`, `button.css` z `--venner-*`
- **packages/primitives** – Zag.js `button.machine.ts`, `switch.machine.ts`
- **packages/adapters/solid** – Button z WAI-ARIA, onClick przez kontekst
- **apps/dev** – integracja Venner, VennerStore, theme monitor, Button + injectGnomeTheme
- Specta – derive, serde_json (typowanie AppState, Action)
- SSoT Snapshot API – `export_state`, `validate_state`, `import_state`, `get_schema_version`
- Rehydrate events – `rehydrate:started`, `state:changed`, `rehydrate:completed`
- Rozszerzony `AppState` – `schemaVersion`, `session`, `ui`, `window.scroll/viewport`, `widget.persistent/transient`
- `apps/dev` – panel `SSoT Import/Export` (export/validate/import + raport)

### Do Zrobienia 🔴
- Zag.js Switch – pełna implementacja w adapterze (`machine + connect + Switch.tsx + switch.css`)
- KDE theme loader (placeholder)

### Wzorzec rozbudowy komponentów (v1.1+)

Dla każdego kolejnego widgetu obowiązuje pipeline:

1. `primitives/<widget>.machine.ts` (logika stanu, eventy, A11y)
2. `primitives/<widget>.connect.ts` (API `rootProps`, `state`, mapowanie eventów)
3. `adapters/solid/<Widget>.tsx` (`useMachine(machine, props)` + `connect(service)`)
4. `ui/styles/<widget>.css` (`data-*` + `--venner-*`)
5. `apps/dev` scenariusz testowy (mouse + keyboard + disabled + focus)

### Architektura Pozostaje Niezmienna
Mimo przerwanej pracy, struktura kaskadowa i decyzje architektoniczne są aktualne i gotowe do kontynuacji.

---

---

## Kluczowe Cechy

1. **Framework-agnostic UI** - adaptery dla SolidJS (referencyjny), React, Vue, Svelte
2. **State Management** - dwuwarstwowy (szczegóły poniżej)
3. **Native Themes** - ekstrakcja motywów z GNOME → `--venner-*` tokens (v1: GNOME, KDE placeholder)
4. **Performance-first** - ~80MB RAM, cold boot ~0.4s, binary IPC zero-copy
5. **Bun ecosystem** - bundler, test runner, package manager
6. **Specta** - TS↔Rust code generation (zgodność z Tauri v2)

---

## Struktura Monorepo (Kaskada Zależności)

```
KASKADA (build-time, bez cykli):
┌─────────────────────────────────────────────────────────────┐
│  apps/dev                                                   │ ← najwyżej
│      │                                                       │
│      ▼                                                       │
│  packages/adapters/solid (@venner/solid)                     │
│      │                                                       │
│      ▼                                                       │
│  packages/themes/*    ← runtime registration, NIE build dep │
│      │                                                       │
│      ▼                                                       │
│  packages/ui           ← CSS templates, --venner-* tokens   │
│      │                                                       │
│      ▼                                                       │
│  packages/primitives    ← Zag.js machines (używa core API)  │
│      │                                                       │
│      ▼                                                       │
│  packages/core          ← Rust store, Tauri API             │
│      │                                                       │
│      ▼                                                       │
│  crates/venner_core     ← Rust binary (single source truth) │ ← najniżej
└─────────────────────────────────────────────────────────────┘

**Zasada**: core NIE zależy od niczego. Każda warstwa zależy tylko od warstwy poniżej.

### packages/ui - Czysty CSS Bez Logiki

`@venner/ui` – szablony CSS:
- Pliki `.css` z klasami `.venner-button`, `.venner-switch` (tokens.css, button.css)
- Zmienne `--venner-*` – theme loader (GNOME) wypełnia je przy starcie
- Eksport: `@venner/ui/styles/tokens.css`, `@venner/ui/styles/button.css`

---

## Problemy Architektoniczne i Rozwiązania

### Problem 1: Integracja Zag.js ↔ Rust Redux

**NIE są sprzeczne** - komplementarne warstwy, różne odpowiedzialności:

```
┌──────────────────────────────────────────────────────────────┐
│                    RUST REDUX STORE                            │ ← Single Source of Truth
│  dispatch(Action) → reduce → broadcast(delta)                 │
│       ▲                                                      │
│       │ read-only projection                                 │
│       │                                                      │
│  ┌────┴────┐         ┌────────────────────────────────────┐  │
│  │   JS    │         │          Zag.js Machines           │  │
│  │ Projection│         │  hover, focus, keyboard nav,    │  │
│  │  cache  │         │  WAI-ARIA, transitions            │  │
│  └────┬────┘         │  (transient UI state)              │  │
│       │              └────────────────────────────────────┘  │
│       │ read/observe         │              │                │
│       ▼                      ▼              ▼                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Framework Adapter (SolidJS)               │    │
│  │     machine.context → component props + effects       │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

| Warstwa | Odpowiedzialność | Przykład |
|:---|:---|:---|
| **Rust Redux** | Model danych (persisted) | `checked: true`, `selectedItems: [1,3]`, `windowPosition: {x,y}` |
| **Zag.js** | UI interactions (transient) | `hover`, `focus`, `keyboard:Tab`, `transition:end` |
| **Framework** | Reaktywność | `createEffect(() => props.checked = api.checked)` |

**Kontrakt**:
- Rust Redux = **single source of truth** (serializowalny)
- Zag.js = **local controller** (nieprzewidywalny, testowalny bez backendu)
- JS Projection = **cache** (read-only)
- Framework Adapter = **glue** (mapuje jedno na drugie)

### Problem 2: Trzy warstwy = złożoność
**Rozwiązanie**: Jasny kontrakt:
- JS **nigdy** nie zapisuje bezpośrednio - tylko przez `dispatch()`
- Zag.js odczytuje z JS projection, nigdy z Rust
- Time-travel działa tylko na Rust store (Zag.js resetuje się)

### Problem 3: IPC latency dla dużych danych
**Rozwiązanie** (na później):
- Binary channels dla plików/obuazów
- invoke() dla małych payloadów
- Base64 zakazane (linter)

### Problem 4: Phantom dependencies
**Rozwiązanie**: Bun workspaces + explicit `package.json`

### Problem 5: Circular dependencies
**Rozwiązanie**: Kaskada - każda warstwa zależy tylko od warstwy poniżej

### Problem 6: KDE/Windows themes
**Rozwiązanie**: Odłożone na v2.0. **v1.0 = tylko GNOME**.

### Problem 7: Testing framework
**Rozwiązanie**: **Bun test** (oficjalny, fastest)

### Problem 8: Pixel-perfect tests
**Rozwiązanie**: **Playwright** (screenshot comparison)

### Problem 9: CodeGen TS↔Rust
**Rozwiązanie**: **Specta** (zgodność z Tauri v2)

---

## Stack Technologiczny v1.0

| Warstwa | Technologia | Rola |
|---------|-------------|------|
| Runtime | Bun | Package manager, bundler, test runner |
| Backend | Tauri v2 | Window management, native APIs |
| State (model) | Rust Redux | Single source of truth, persistence |
| State (UI) | Zag.js | Headless state machines, A11y |
| UI Framework | SolidJS (v1) | Referencyjny adapter |
| CodeGen | Specta | TS↔Rust types |
| Build | Turborepo + Cargo | Orchestracja monorepo |
| Styling | CSS Variables | --venner-* tokens |
| Testing | Bun test | Unit tests |
| Visual Tests | Playwright | Screenshot comparison |

---

## MVP Roadmap (7 tygodni)

1. **Tydzień 1**: Monorepo scaffold + Bun + Tauri + core (Rust store)
2. **Tydzień 2-3**: Rust Redux + primitives (Zag.js) + GNOME theme
3. **Tydzień 3-5**: Zag.js machines (Button, Switch, ListView, Window)
4. **Tydzień 5-6**: SolidJS adapter + ui templates
5. **Tydzień 7**: DX polish, benchmarks, docs

---

## Co Nas Wyróżnia

| Cecha | Electron | Flutter | Venner |
|-------|----------|---------|--------|
| RAM (hello world) | ~130MB | ~55MB | **~35MB** |
| Install size | ~120MB | ~20MB | **~4.5MB** |
| Cold boot | ~1.5s | ~0.8s | **~0.4s** |
| Framework agnostic | ❌ | ❌ | ✅ |
| Redux-style state | JS | ❌ | **Rust** |
| Native themes | ❌ | ❌ | **✅ GNOME** |
| Bun ecosystem | ❌ | ❌ | ✅ |
| WAI-ARIA 100% | ✅ (HTML) | ~80% | **✅ (Zag.js)** |

---

## Inne Cechy

- **Tray-Only Mode** przy starcie (35MB RAM niezauważalne)
- **Time-travel debugging** - replay akcji z histori
- **Crash recovery** - auto-snapshot przed crashem
- **Window State Plugin** - synchronizacja pozycji/rozmiaru okien
- **Focus Ring Manager** - detekcja Mouse vs Tab navigation
- **Virtualized lists** - @tanstack/virtual强制 dla >50 elementów
- **UPX compression** - instalator <5MB
- **Isolation Pattern** - frontend bez dostępu do Node API

---

## Struktura Packages Szczegółowo

```
packages/
├── core/              # IPC + Store Projection
│   ├── api/           # invoke(), listen()
│   ├── store.ts       # VennerStore (JS projection)
│   └── types.ts       # AppState, Action
│
├── primitives/        # Zag.js Machines
│   ├── button.machine.ts   # onClick, WAI-ARIA
│   ├── switch.machine.ts
│   └── index.ts
│
├── ui/                # Pure CSS Templates
│   ├── styles/
│   │   ├── tokens.css       # --venner-* design tokens
│   │   └── button.css
│   └── index.ts
│
├── themes/
│   ├── gnome/         # GTK → --venner-* (get_gtk_theme, theme:changed)
│   │   ├── loader.ts  # invoke + listen, injectTokens()
│   │   └── tokens.ts
│   │
│   └── kde/           # (v1 placeholder)
│
└── adapters/
    └── solid/         # SolidJS Bindingi
        ├── Button.tsx
        ├── hooks/     # useStore
        └── index.ts
```

### crates/venner_core (Rust)

```
venner_core/src/
├── theme/             # Parsery GTK, resolver, monitor
│   ├── parser_gtk3.rs
│   ├── parser_gtk4.rs
│   ├── path.rs        # VENNER_THEMES_DIR, VENNER_DEV_THEME
│   ├── monitor.rs     # gsettings monitor, load_theme_tokens
│   └── resolver.rs
├── state/             # AppState, VennerStore
├── ipc/               # commands (dispatch, get_gtk_theme, ...)
└── lib.rs
```

---

## Problemy Do Rozwiązania Przed Implementacją

1. ✅ Zag.js vs Rust Redux - jasny kontrakt (kaskada warstw)
2. ✅ Kaskada zależności - brak cykli (monorepo v2.0)
3. ✅ KDE/Windows themes - **odłożone na v2.0** (tylko GNOME v1)
4. ✅ Testing framework - **Bun test**
5. ✅ Pixel-perfect tests - **Playwright**
6. ✅ CodeGen (TS↔Rust) - **Specta**
7. ⚠️ **IPC binary channels** - NA PÓŹNIEJ (v1.0: invoke() wystarczy)
8. ⚠️ **Performance CI** - brak konfiguracji benchmarków

---

## Indeks Dokumentacji

1.  **Analiza Porównawcza** - Benchmarks Tauri/Electron/Flutter
2.  **Integracja Natywna** - Window State Plugin
3.  **Strategia Designu** - Theme extraction tokens
4.  **Analiza Bottlenecks** - IPC latency, performance budgets
5.  **Architektura Monorepo** - Warstwy, zasady
6.  **Mapa Drogowa** - Fazy implementacji MVP
7.  **Plan Architektoniczny** - Adaptery, Zag.js integration
8.  **Audyt Visage** - Legacy analysis (kontekst historyczny)
9.  **Krajobraz Rynkowy** - AI requirements, positioning
10. **Architektura Stanu** - Rust Redux Store szczegóły
11. **Plan Monorepo** - Wielojęzykowa orkiestracja, kaskada zależności
12. **Button Architektura** - GNOME GTK4 vs KDE Plasma 5
13. **Analiza Ewolucji** - Visage Old → Venner New (szczegółowa analiza różnic)

---

## Kontekst Historyczny: Visage Old

Projekt `visage_old` (2024) był prototypem monolitycznym:
- **React 18** + Tauri 1.x
- **Brak state management** — useState + useEffect
- **CSS Modules** — brak design tokens
- **Brak theme extraction** — hardcoded styles

**Analiza ewolucji** → patrz `13_analiza_ewolucji.md`

Kluczowe lekcje z visage_old:
- Monolith ❌ → Monorepo ✅
- useState ❌ → Rust Store + Zag.js ✅
- CSS Modules ❌ → CSS Variables + Theme Injection ✅
- React-only ❌ → Framework-agnostic ✅

### Konfiguracja Development (resources/themes)

| Zmienna | Opis |
|---------|------|
| `VENNER_THEMES_DIR` | Nadpisuje ścieżkę do motywów projektu |
| `VENNER_DEV_THEME` | Wymusza motyw: `default-gtk3` \| `default-gtk4` \| `mint-l-dark-sand-gtk3` |

Patrz: `Venner/resources/themes/README.md`
