#!/usr/bin/env bash

# Wspólne narzędzia dla skryptów w scripts/

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$(cd "$COMMON_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCRIPTS_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_TAG="script"

init_script() {
  SCRIPT_TAG="${1:-script}"
  cd "$REPO_ROOT"
}

log_info() { echo -e "${BLUE}[${SCRIPT_TAG}]${NC} $*"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

die() {
  log_error "$*"
  exit 1
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Brak wymaganego polecenia: $cmd"
}

load_bun_env() {
  if [[ -f "$HOME/.bun/bin/env" ]]; then
    . "$HOME/.bun/bin/env" 2>/dev/null || true
  fi
  if [[ -d "$HOME/.bun/bin" ]]; then
    export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
    export PATH="$HOME/.bun/bin:$PATH"
  fi
}

load_cargo_env() {
  if [[ -f "$HOME/.cargo/env" ]]; then
    . "$HOME/.cargo/env" 2>/dev/null || true
  fi
}

print_unknown_arg_and_usage() {
  local arg="$1"
  local usage="$2"
  log_error "Nieznany argument: $arg"
  echo
  echo "$usage"
  exit 2
}
