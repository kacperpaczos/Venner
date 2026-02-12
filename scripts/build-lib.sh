#!/usr/bin/env bash
# Venner monorepo - build full workspace (TS + Rust)
# Uwaga: mimo nazwy build-lib, skrypt buduje CALY workspace.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "build-lib"

USAGE=$'Usage:\n  ./scripts/build-lib.sh\n\nOpis:\n  Buduje CALY workspace: codegen -> turbo build -> cargo build --workspace.\n'

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
log_info "Codegen typow TS z Rust (bun run codegen)..."
bun run codegen
log_ok "codegen"

log_info "Build pakietow workspace (bun run build)..."
bun run build
log_ok "build workspace (TS/apps)"

log_info "Build workspace Rust (cargo build --workspace)..."
cargo build --workspace
log_ok "build Rust"

echo
log_ok "Przebudowa bibliotek zakończona."
