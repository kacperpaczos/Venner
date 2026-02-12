# Venner Dev App

`apps/dev` is the reference application for the Venner framework.
It demonstrates the full flow: Rust/Tauri store + theme extraction + Solid adapter + UI primitives.
GTK4/Libadwaita parity references live in `tools/gtk-reference/README.md`.

## Run

From the monorepo root:

```bash
./scripts/setup-system.sh
./scripts/install-deps.sh
./scripts/build-lib.sh
./scripts/dev.sh
# lub szybciej (bez rebuild bibliotek):
./scripts/dev.sh --skip-build

# albo bezpośrednio:
bun run dev
```

From this directory only:

```bash
bun install
bun run dev
```

## What `bun run dev` does here

- starts `tauri dev`
- runs `beforeDevCommand` (`bun run dev:frontend`)
- launches Vite on port `1420` with HMR
- builds and runs the Rust side of the Tauri app

## Theme overrides

```bash
VENNER_DEV_THEME=default-gtk4 bun run dev
VENNER_DEV_THEME=mint-l-dark-sand-gtk3 bun run dev
VENNER_THEMES_DIR=<themes_dir> bun run dev
```

## Recommended IDE setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
