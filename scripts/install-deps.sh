#!/usr/bin/env bash
# Venner monorepo - instalacja zależności projektu (JS workspace)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "deps"

USAGE=$'Usage:\n  ./scripts/install-deps.sh\n\nOpis:\n  Instaluje zaleznosci workspace (bun install) bez build/check/test.\n'

if [[ "${1:-}" == "--help" ]]; then
  echo "$USAGE"
  exit 0
fi

if [[ $# -gt 0 ]]; then
  print_unknown_arg_and_usage "$1" "$USAGE"
fi

load_bun_env
require_cmd bun

log_info "Katalog: $REPO_ROOT"
log_info "Instalacja zależności workspace (bun install)..."
bun install

echo
log_ok "Zależności projektu zainstalowane."
echo "Następny krok: ./scripts/build-lib.sh"
