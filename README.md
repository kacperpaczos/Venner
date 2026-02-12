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

Run from the monorepo root:

```bash
bun install
bun run dev
```

`bun run dev` runs the full dev pipeline (codegen -> Tauri dev -> Vite HMR).

## Clean Rebuild (From Scratch)

```bash
# 1) Clean
rm -rf node_modules
rm -rf apps/dev/node_modules
rm -rf target
rm -f packages/core/src/types/generated.ts

# 2) Install
bun install

# 3) Generate TypeScript types from Rust (Specta)
bun run codegen

# 4) Validate types
bun run typecheck

# 5) Build all packages/apps
bun run build
```

## Run the Dev App

```bash
bun run dev
```

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
