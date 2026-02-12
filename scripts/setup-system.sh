#!/usr/bin/env bash
# Venner monorepo - instalacja TYLKO zależności systemowych (apt, Rust, Bun)
# Obsługuje: Ubuntu / Debian

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "system-setup"

USAGE=$'Usage:\n  ./scripts/setup-system.sh\n\nOpis:\n  Instaluje tylko zaleznosci systemowe: apt deps, Rust i Bun.\n'

if [[ "${1:-}" == "--help" ]]; then
  echo "$USAGE"
  exit 0
fi

if [[ $# -gt 0 ]]; then
  print_unknown_arg_and_usage "$1" "$USAGE"
fi

log_info "Katalog monorepo: $REPO_ROOT"
echo

# --- 1. Sprawdzenie systemu ---
log_info "Etap 1/4: Weryfikacja systemu (Ubuntu/Debian)..."

if ! command -v apt-get &>/dev/null; then
  die "Wymagany apt-get (Ubuntu/Debian). Ten skrypt nie obsluguje innych dystrybucji."
fi
log_ok "System: Debian/Ubuntu"
echo

require_cmd sudo
require_cmd curl

# --- 2. Pakiety systemowe dla Tauri 2.x ---
log_info "Etap 2/4: Instalacja pakietów systemowych (Tauri 2.x)..."

TAURI_DEPS=(
  build-essential
  curl
  file
  libayatana-appindicator3-dev
  libgtk-3-dev
  libjavascriptcoregtk-4.1-dev
  librsvg2-dev
  libssl-dev
  libsoup-3.0-dev
  libwebkit2gtk-4.1-dev
  patchelf
  pkg-config
  wget
)

sudo apt-get update -qq
sudo apt-get install -y "${TAURI_DEPS[@]}"
log_ok "Pakiety systemowe zainstalowane"
echo

# --- 3. Rust ---
log_info "Etap 3/4: Weryfikacja Rust (wymagane 1.85+ dla edition 2024)..."

NEED_RUST=false
if ! command -v rustc &>/dev/null; then
  NEED_RUST=true
  log_warn "Rust nie znaleziony - instalacja via rustup..."
else
  RUST_VER=$(rustc --version 2>/dev/null | grep -oP '\d+\.\d+' | head -1)
  RUST_MAJOR="${RUST_VER%%.*}"
  RUST_MINOR="${RUST_VER#*.}"
  RUST_MINOR="${RUST_MINOR%%.*}"
  if [[ "$RUST_MAJOR" -lt 1 ]] || { [[ "$RUST_MAJOR" -eq 1 ]] && [[ "$RUST_MINOR" -lt 85 ]]; }; then
    NEED_RUST=true
    log_warn "Rust $RUST_VER < 1.85 - aktualizacja via rustup..."
  else
    log_ok "Rust $RUST_VER - OK"
  fi
fi

if [[ "$NEED_RUST" == "true" ]]; then
  if command -v rustup &>/dev/null; then
    rustup update
  else
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    load_cargo_env || true
    export PATH="$HOME/.cargo/bin:$PATH"
  fi
  log_ok "Rust zainstalowany: $(rustc --version)"
fi
echo

# --- 4. Bun ---
log_info "Etap 4/4: Weryfikacja Bun (wymagane 1.3.8+)..."

NEED_BUN=false
if ! command -v bun &>/dev/null; then
  NEED_BUN=true
  log_warn "Bun nie znaleziony - instalacja via oficjalny skrypt..."
else
  BUN_VER=$(bun --version 2>/dev/null || echo "0.0.0")
  log_ok "Bun $BUN_VER - OK"
fi

if [[ "$NEED_BUN" == "true" ]]; then
  curl -fsSL https://bun.sh/install | bash
  load_bun_env
  log_ok "Bun zainstalowany: $(bun --version)"
fi
echo

log_ok "Zależności systemowe zainstalowane."
echo
echo "Następne kroki:"
echo "  ./scripts/install-deps.sh   # instalacja zależności projektu"
echo "  ./scripts/build-lib.sh      # przebudowa bibliotek (TS + Rust)"
echo "  ./scripts/check.sh          # statyczne checki i lintery"
echo "  ./scripts/test.sh           # testy JS/TS i Rust"
echo "  ./scripts/dev.sh            # rebuild + uruchomienie app dev"
echo
