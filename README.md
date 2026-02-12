# Venner

Venner is a framework for building native-feeling desktop apps with web technologies.
It combines a Rust/Tauri core, framework-agnostic widget primitives (Zag.js), and theme extraction from GTK into CSS tokens (`--venner-*`).

## Project Status

None

## Architecture (Short)

- `crates/venner_core`: Rust single source of truth (state, IPC, GTK parsing/monitoring)
- `packages/core`: JS IPC/store projection and shared types
- `packages/primitives`: headless widget state machines (Zag.js)
- `packages/ui`: CSS templates and design tokens
- `packages/themes/gnome`: GTK theme -> CSS variable mapping
- `packages/adapters/solid`: Solid adapter for primitives + UI
- `apps/dev`: reference Tauri app using `@venner/*`

## Development

Szczegółowa instrukcja workflow skryptów jest w `scripts/README.md`.

One-liner po `git clone`:

```bash
./scripts/setup-system.sh && ./scripts/install-deps.sh && ./scripts/build-lib.sh && ./scripts/check.sh && ./scripts/test.sh && ./scripts/dev.sh
```

### Uruchamianie dev

From monorepo root:

```bash
bun run dev
```

`bun run dev` runs the full dev pipeline (codegen -> Tauri dev -> Vite HMR).

Optional theme override:

```bash
VENNER_DEV_THEME=default-gtk4 bun run dev
# or
VENNER_DEV_THEME=mint-l-dark-sand-gtk3 bun run dev
```

To override the themes directory:

```bash
VENNER_THEMES_DIR=<themes_dir> bun run dev
```

See also: `resources/themes/README.md`.
