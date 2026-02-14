#!/usr/bin/env bash
# Venner monorepo - uruchamianie testów (JS/TS + Rust)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "test"

USAGE=$'Usage:\n  ./scripts/test.sh\n\nOpis:\n  Uruchamia testy JS/TS (bun run test) oraz testy Rust (cargo test --workspace).\n'

if [[ "${1:-}" == "--help" ]]; then
  echo "$USAGE"
  exit 0
fi

if [[ $# -gt 0 ]]; then
  print_unknown_arg_and_usage "$1" "$USAGE"
fi

load_cargo_env
load_bun_env
require_cmd bun
require_cmd cargo

log_info "Katalog: $REPO_ROOT"

log_info "bun run test..."
bun run test
log_ok "testy JS/TS"

log_info "cargo test --workspace..."
cargo test --workspace
log_ok "testy Rust"

echo
log_ok "Wszystkie testy zakończone pomyślnie."
