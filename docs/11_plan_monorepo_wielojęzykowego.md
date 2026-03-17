# 11. Plan Monorepo: Pełna Struktura i Konfiguracja

Szczegółowa specyfikacja struktury katalogów, plików konfiguracyjnych i zależności dla monorepo Venner (Rust + JS/TS).

## 0. Zasada Kaskady (Brak Cyklicznych Zależności)

```
KASKADA ZALEŻNOŚCI (build-time):
┌─────────────────────────────────────────────────────────────┐
│  apps/dev                                                   │ ← najwyżej (używa wszystkiego)
│      │                                                       │
│      ▼                                                       │
│  packages/adapters/solid                                     │
│      │                                                       │
│      ▼                                                       │
│  packages/themes/*    ← theme loader (runtime registration)  │
│      │                                                       │
│      ▼                                                       │
│  packages/ui           ← CSS templates, --venner-* tokens   │
│      │                                                       │
│      ▼                                                       │
│  packages/primitives    ← Zag.js machines (używa core API)  │
│      │                                                       │
│      ▼                                                       │
│  packages/core          ← Rust store, Tauri API (najniżej) │
│      │                                                       │
│      ▼                                                       │
│  crates/venner_core     ← Rust binary (źródło prawdy)       │ ← najniżej
└─────────────────────────────────────────────────────────────┘

**Kluczowa zasada**: 
- core NIE zależy od niczego (najniższa warstwa)
- primitives zależą OD core (do dispatch/select)
- ui zależy OD niczego (tylko CSS variables)
- themes NIE mają build-time dependency na core - używają runtime API
- adapters zależą od primitives + ui + themes
- apps zależą od adapters + themes
```

---

## 1. Drzewo Katalogów (File Tree)

```text
venner/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Build & Test (Rust + JS)
│       └── release.yml            # Changesets release
├── .vscode/
│   └── settings.json              # Deno/Bun settings, Rust analyzer
├── apps/
│   └── dev/                       # [PRIVATE] Developer Playground
│       ├── src-tauri/             # Rust Entrypoint
│       │   ├── src/
│       │   │   └── main.rs        # App setup, plugin registration
│       │   ├── Cargo.toml         # Dependencies: venner_core
│       │   └── tauri.conf.json    # App config (allowlist, windows)
│       ├── src/                   # Frontend Entrypoint
│       │   ├── App.tsx            # Test harness
│       │   ├── index.css
│       │   └── main.tsx
│       ├── package.json           # Deps: @venner/solid, @venner/ui
│       ├── tsconfig.json
│       └── vite.config.ts
├── crates/                        # [RUST WORKSPACE]
│   ├── venner_core/               # [LIB] Main Framework Logic
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── app_state.rs       # Struct AppState (SOT)
│   │   │   ├── store.rs           # VennerStore impl
│   │   │   ├── commands.rs        # Tauri commands (dispatch, inject)
│   │   │   └── ipc.rs             # Zero-copy channels
│   │   └── Cargo.toml             # Deps: tauri, serde, tokio, sled
│   └── venner_macros/             # [PROC-MACRO]
│       ├── src/lib.rs
│       └── Cargo.toml             # Deps: syn, quote
├── packages/                      # [JS WORKSPACE]
│   ├── core/                      # [LIB] JS Client & Types
│   │   ├── src/
│   │   │   ├── api/               # IPC wrappers (invoke, emit, listen)
│   │   │   ├── store.ts           # VennerStore projection (JS side)
│   │   │   ├── index.ts           # Public exports
│   │   │   └── types.ts           # Specta-generated types (AppState, Action)
│   │   ├── package.json           # Deps: tauri-api, @venner/tsconfig
│   │   └── tsconfig.json
│   ├── primitives/                # [LIB] Headless UI (Zag.js)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── switch.machine.ts  # Zag.js machine: context.checked
│   │   │   ├── button.machine.ts
│   │   │   ├── listview.machine.ts
│   │   │   └── types.ts           # Machine types + core API types
│   │   ├── package.json           # Deps: @venner/core, zag-js, @venner/tsconfig
│   │   └── tsconfig.json
│   ├── ui/                        # [LIB] CSS & HTML Templates
│   │   ├── src/
│   │   │   ├── styles/
│   │   │   │   ├── tokens.css     # --venner-* CSS variables (empty shells)
│   │   │   │   ├── button.css
│   │   │   │   ├── switch.css
│   │   │   │   └── layout.css
│   │   │   └── index.ts           # Exports: Button, Switch, etc. components
│   │   ├── package.json           # Deps: @venner/tsconfig (ZERO deps on core/primitives!)
│   │   └── tsconfig.json
│   ├── themes/                    # [GROUP] Theme Loaders (Runtime)
│   │   ├── gnome/                # [LIB] GNOME Theme Bridge
│   │   │   ├── src/
│   │   │   │   ├── loader.ts      # Parse GTK, inject --venner-* via core API
│   │   │   │   ├── index.ts       # registerTheme(loader)
│   │   │   │   └── tokens.ts      # Token mapping logic
│   │   │   ├── package.json       # Deps: @venner/core (runtime import ONLY)
│   │   │   └── tsconfig.json
│   │   └── kde/                   # [LIB] KDE Theme Bridge (Placeholder v1.0)
│   │       ├── src/
│   │       │   ├── loader.ts      # TODO: Parse kdeglobals
│   │       │   ├── index.ts
│   │       │   └── tokens.ts
│   │       ├── package.json
│   │       └── tsconfig.json
│   └── adapters/                  # [GROUP] Framework Adapters
│       └── solid/                 # [LIB] SolidJS Components (Reference)
│           ├── src/
│           │   ├── Button.tsx      # Imports: primitives + ui + core
│           │   ├── Switch.tsx
│           │   ├── index.ts        # Re-exports all components
│           │   └── hooks/          # useStore, useTheme
│           ├── package.json        # Deps: @venner/core, @venner/primitives, @venner/ui, solid-js
│           └── tsconfig.json
├── tooling/                       # [SCRIPTS]
│   └── scripts/
│       └── codegen.sh             # Generowanie typów TS z Rust
├── Cargo.toml                     # [ROOT] Workspace definition
├── package.json                   # [ROOT] Private, scripts
├── turbo.json                     # [ROOT] Pipeline config
├── bunfig.toml                    # [ROOT] Bun config
└── tsconfig.base.json             # [ROOT] Shared TS config
```

---

## 2. Kluczowe Pliki Konfiguracyjne

### 2.1. Root `Cargo.toml`
Definiuje workspace Rust. Kluczowe: wspólny folder `target` (szybsze budowanie) i `resolver = "2"`.

```toml
[workspace]
members = [
  "crates/*",
  "apps/*/src-tauri"
]
resolver = "2"

[workspace.package]
version = "0.1.0"
authors = ["Venner Team"]
edition = "2024"
license = "MIT"

[workspace.dependencies]
# Core dependencies shared across crates
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri = { version = "2.0.0", features = [] }
tauri-build = { version = "2.0.0", features = [] }
specta = { version = "2.0.0", features = ["tauri", "typescript"] }
tokio = { version = "1.0", features = ["full"] }
thiserror = "1.0"
```

### 2.2. Root `package.json`
Definiuje workspace JS (Bun) i skrypty globalne.

```json
{
  "name": "venner-monorepo",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*",
    "packages/themes/*",
    "packages/adapters/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "bun test",
    "typecheck": "turbo run typecheck",
    "codegen": "cargo test --workspace --test specta_export"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "prettier": "^3.5.0",
    "typescript": "^5.7.0",
    "@biomejs/biome": "latest"
  },
  "packageManager": "bun@1.2.0"
}
```

### 2.3. Root `turbo.json`
Orkiestracja zadań. Kluczowe: `build` zależy od `codegen` (najpierw typy z Rusta).

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build", "codegen"],
      "outputs": ["dist/**"]
    },
    "codegen": {
      "inputs": ["crates/**/*.rs"],
      "outputs": ["packages/core/src/types/**/*.ts"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["codegen"]
    },
    "test": {
      "cache": false
    }
  }
}
```

---

## 3. Zależności Wewnętrzne (Dependency Graph)

### 3.1. Crates (Rust)
*   **venner_core**: Zero dependencies on other local crates (najniższa warstwa).
*   **apps/dev/src-tauri**: Depends on `venner_core`.

### 3.2. Packages (JS) - KASKADA (bez cykli)

| Pakiet | Zależności (build-time) | Rola |
|:-------|:---|:---|
| `@venner/core` | (brak) | IPC wrappers, Store projection, types |
| `@venner/primitives` | `@venner/core` | Zag.js machines, dispatch/select API |
| `@venner/ui` | (brak) | CSS templates, --venner-* tokens |
| `@venner/themes/gnome` | `@venner/core` (runtime only) | GTK parser, inject tokens at runtime |
| `@venner/themes/kde` | `@venner/core` (runtime only) | kdeglobals parser, placeholder v1.0 |
| `@venner/solid` | `@venner/core`, `@venner/primitives`, `@venner/ui` | SolidJS adapter |
| `apps/dev` | `@venner/solid`, `@venner/themes/gnome` | Dev app |

### 3.3. Dlaczego NIE Ma Cykli?

```
WRONG (cycle!):                    RIGHT (cascade):
themes/gnome ─────┐                 core ──► primitives ──► ui ──► adapters
      ▲           │                     │                    │         │
      │           │                     │                    │         ▼
core ──┘           │                     ▼                    ▼     apps/dev
                   │                    themes               solid
                   │                  (runtime reg)
```

**Rozwiązanie**:
- themes/gnome używa `@venner/core` TYLKO do wywołania `injectTokens()` przy starcie
- To NIE jest import na poziomie modułu TypeScript - to dynamiczne wywołanie
- core NIE wie o istnieniu themes - theme rejestruje się sam przez `registerTheme()`

```typescript
// @venner/themes/gnome/src/index.ts
import { registerTheme } from './loader';

// Re-export dla方便
export { loadGnomeTheme, injectTokens } from './loader';

// Automatyczna rejestracja przy imporcie
registerTheme(loadGnomeTheme);
```

### 3.4. Dlaczego `@venner/ui` Nie Zależy Od Niczego?

- `ui` dostarcza tylko pliki CSS z klasami `.venner-button`, `.venner-switch`
- CSS używa zmiennych `--venner-*`, ale te zmienne są puste w `tokens.css`
- Zmienne są wypełniane PRZEZ THEMES przy starcie aplikacji
- `ui` jest "głupim" dostawcą struktury - nie potrzebuje niczego innego

```css
/* @venner/ui/tokens.css - puste powłoki */
:root {
  --venner-bg: initial;
  --venner-fg: initial;
  --venner-accent: initial;
  /* ... */
}
```

---

## 4. CodeGen (Most Rust ↔ TS)

Używamy **Specta** dla TS↔Rust code generation (zgodność z Tauri v2).

### Konfiguracja w `crates/venner_core`

```rust
// crates/venner_core/src/app_state.rs
use specta::Type;

#[derive(Serialize, Deserialize, Type)]
#[specta(export)]
pub struct AppState {
    pub windows: HashMap<String, WindowState>,
    // ...
}
```

### Automatyczna Generacja Typów

```json
// turbo.json - codegen uruchamia się PRZED build
{
  "tasks": {
    "build": {
      "dependsOn": ["^build", "codegen"],
      "outputs": ["dist/**", "packages/core/src/types/**/*.ts"]
    },
    "codegen": {
      "inputs": ["crates/**/*.rs"],
      "outputs": ["packages/core/src/types/"],
      "cache": true
    }
  }
}
```

**Ważne**: Generowane typy są w `packages/core/src/types/`, NIE w `bindings/`. `types/` jest commitowany do repo (stable API).

---

## 5. Konfiguracja TypeScript (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "baseUrl": ".",
    "paths": {
      "@venner/*": ["packages/*/src"]
    }
  }
}
```

Każdy pakiet w `packages/` dziedziczy po tym pliku i dodaje tylko `include/exclude`.
