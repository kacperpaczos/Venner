# Skrypty developerskie (`scripts/`)

Ten katalog zawiera cały workflow po `git clone`.

## One-liner (pełny start)

```bash
./scripts/setup-system.sh && ./scripts/install-deps.sh && ./scripts/build-lib.sh && ./scripts/check.sh && ./scripts/test.sh && ./scripts/dev.sh
```

## Co robi każdy skrypt

- `setup-system.sh` - instaluje zależności systemowe (apt), Rust i Bun.
- `install-deps.sh` - instaluje zależności workspace (`bun install`).
- `build-lib.sh` - buduje caly workspace (`codegen`, `bun run build`, `cargo build --workspace`).
- `check.sh` - uruchamia statyczne checki i lintery (bez testów i bez instalacji deps).
- `test.sh` - uruchamia testy JS/TS i Rust.
- `dev.sh` - zawsze czyści deps JS, robi install deps, przebudowuje workspace (chyba że `--skip-build`) i startuje appkę dev.

## Kontrakt skryptów

- `setup-system.sh`
  - robi: setup narzędzi systemowych (apt/Rust/Bun),
  - nie robi: `bun install`, build, check, test.
- `install-deps.sh`
  - robi: tylko `bun install`,
  - nie robi: setup systemowy, build, check, test.
- `build-lib.sh`
  - robi: full workspace build (TS + Rust),
  - nie robi: instalacja deps, testy, start deva.
- `check.sh`
  - robi: codegen, typecheck, lint, cargo check,
  - nie robi: `bun install`, testy.
- `test.sh`
  - robi: `bun run test` + `cargo test --workspace`,
  - nie robi: install deps ani build.
- `dev.sh`
  - robi: clean node_modules + install deps + (opcjonalnie) build + `bun run dev`,
  - nie robi: setup systemowy.

## Typowa kolejność

```bash
./scripts/setup-system.sh
./scripts/install-deps.sh
./scripts/build-lib.sh
./scripts/check.sh
./scripts/test.sh
./scripts/dev.sh
```

Szybszy restart deva bez przebudowy bibliotek:

```bash
./scripts/dev.sh --skip-build
```

## Troubleshooting

- `ENOSPC: no space left on device`
  - zwolnij miejsce na dysku (`df -h`), usuń zbędne artefakty (`rm -rf node_modules target`), potem odpal flow ponownie.
- `Brak bun`
  - uruchom `./scripts/setup-system.sh` i zweryfikuj `bun --version`.
- `Brak cargo/rustc`
  - uruchom `./scripts/setup-system.sh`, ewentualnie `source ~/.cargo/env`, sprawdź `cargo --version`.
- `Brak zależności JS`
  - uruchom `./scripts/install-deps.sh` przed `check.sh`, `test.sh` lub `build-lib.sh`.
