#!/usr/bin/env bash
# Venner monorepo - rebuild bibliotek i uruchomienie app dev
# Cel: uruchomić apps/dev na najnowszej wersji bibliotek z monorepo

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "dev"

SKIP_BUILD=false
USAGE=$'Usage:\n  ./scripts/dev.sh [--skip-build]\n\nOpis:\n  Zawsze czyści node_modules, instaluje deps i uruchamia app dev.\n  Domyslnie robi tez pelny rebuild workspace przez build-lib.sh.\n\nOpcje:\n  --skip-build   Pomin przebudowe workspace.\n'

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --help) echo "$USAGE"; exit 0 ;;
    *) print_unknown_arg_and_usage "$arg" "$USAGE" ;;
  esac
done

load_cargo_env
load_bun_env
require_cmd bun

log_info "Katalog: $REPO_ROOT"
log_info "Tryb: $([ "$SKIP_BUILD" = true ] && echo "skip-build (bez przebudowy bibliotek)" || echo "pełny rebuild bibliotek")"
echo

# Fresh instalacja zależności JS
log_info "Usuwanie node_modules (root + apps/dev)..."
rm -rf node_modules
rm -rf apps/dev/node_modules
log_ok "Wyczyszczone"

log_info "Instalacja zależności projektu..."
"$SCRIPT_DIR/install-deps.sh"
log_ok "install-deps"

if [[ "$SKIP_BUILD" != "true" ]]; then
  log_info "Przebudowa bibliotek (TS + Rust)..."
  "$SCRIPT_DIR/build-lib.sh"
  log_ok "build-lib"
fi

log_info "bun run dev (uruchomienie app dev)..."
exec bun run dev
