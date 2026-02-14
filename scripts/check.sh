#!/usr/bin/env bash
# Venner monorepo - checks statyczne i lintery (bez testów, bez instalacji deps)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "check"

USAGE=$'Usage:\n  ./scripts/check.sh\n\nOpis:\n  Uruchamia statyczne checki i lintery: codegen, typecheck, lint, cargo check.\n  Nie uruchamia testow i nie instaluje deps.\n'

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
log_info "Zakres: codegen + typecheck + lint + cargo check"
echo

log_info "bun run codegen..."
bun run codegen
log_ok "codegen"

log_info "bun run typecheck..."
bun run typecheck
log_ok "typecheck"

log_info "bun run lint..."
bun run lint
log_ok "lint"

log_info "cargo check --workspace..."
cargo check --workspace
log_ok "cargo check"

echo
log_ok "Checks i lintery zakończone pomyślnie."
