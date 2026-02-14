#!/usr/bin/env bash
# Venner - uruchomienie GTK reference apps (GJS) dla parity workflow

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "gtk-ref"

USAGE=$'Usage:\n  ./scripts/run-gtk-ref.sh [--gtk4|--libadwaita|--both] [--flatpak|--system] [--runtime=RUNTIME]\n\nOpis:\n  Uruchamia referencyjne appki GJS do porownania z Venner.\n  Bez flag skrypt pyta interaktywnie:\n    - co uruchomic (GTK4 / Libadwaita / oba),\n    - jak uruchomic (domyslnie Flatpak, opcjonalnie host/system).\n\nOpcje:\n  --gtk4             Tylko gtk4-gjs\n  --libadwaita       Tylko libadwaita-gjs\n  --both             Obie appki\n  --flatpak          Wymus uruchomienie przez Flatpak\n  --system           Wymus uruchomienie przez hostowy gjs\n  --runtime=RUNTIME  Runtime Flatpak (domyslnie: org.gnome.Sdk//49)\n  --help             Ta pomoc\n'

RUN_GTK4=false
RUN_LIBADWAITA=false
RUN_MODE=""
FLATPAK_RUNTIME="${GTK_REF_FLATPAK_RUNTIME:-org.gnome.Sdk//49}"

prompt_targets() {
  echo "Co uruchomic?"
  echo "  1) GTK4"
  echo "  2) Libadwaita"
  echo "  3) Obie"
  read -r -p "Wybor [3]: " choice
  case "${choice:-3}" in
    1) RUN_GTK4=true ;;
    2) RUN_LIBADWAITA=true ;;
    3) RUN_GTK4=true; RUN_LIBADWAITA=true ;;
    *) die "Nieprawidlowy wybor: ${choice:-<pusty>}" ;;
  esac
}

prompt_mode() {
  read -r -p "Uruchomic przez Flatpak? [Y/n]: " answer
  case "${answer:-Y}" in
    Y|y|"") RUN_MODE="flatpak" ;;
    N|n) RUN_MODE="system" ;;
    *) die "Nieprawidlowy wybor: $answer" ;;
  esac
}

run_app() {
  local app_path="$1"
  local label="$2"
  [[ -f "$app_path" ]] || die "Brak pliku: $app_path"
  log_info "Uruchamiam ${label} reference..."
  if [[ "$RUN_MODE" == "flatpak" ]]; then
    flatpak run \
      --filesystem="$REPO_ROOT" \
      --socket=session-bus \
      --socket=wayland \
      --socket=fallback-x11 \
      --device=dri \
      --command=gjs \
      "$FLATPAK_RUNTIME" -m "$app_path" &
  else
    gjs -m "$app_path" &
  fi
}

ensure_flatpak_runtime() {
  local runtime="$1"
  if flatpak info "$runtime" >/dev/null 2>&1; then
    return 0
  fi

  log_warn "Brak runtime $runtime. Probuje zainstalowac..."
  flatpak install -y flathub "$runtime" || die "Nie udalo sie zainstalowac $runtime"

  flatpak info "$runtime" >/dev/null 2>&1 || die "Runtime $runtime nadal niedostepny po instalacji"
  log_ok "Zainstalowano runtime $runtime"
}

for arg in "$@"; do
	case "$arg" in
		--gtk4) RUN_GTK4=true ;;
		--libadwaita) RUN_LIBADWAITA=true ;;
    --both) RUN_GTK4=true; RUN_LIBADWAITA=true ;;
    --flatpak) RUN_MODE="flatpak" ;;
    --system) RUN_MODE="system" ;;
    --runtime=*) FLATPAK_RUNTIME="${arg#*=}" ;;
		--help) echo "$USAGE"; exit 0 ;;
		*) print_unknown_arg_and_usage "$arg" "$USAGE" ;;
	esac
done

if [[ "$RUN_GTK4" == "false" && "$RUN_LIBADWAITA" == "false" ]]; then
  if [[ -t 0 ]]; then
    prompt_targets
  else
	  RUN_GTK4=true
	  RUN_LIBADWAITA=true
  fi
fi

if [[ -z "$RUN_MODE" ]]; then
  if [[ -t 0 ]]; then
    prompt_mode
  else
    RUN_MODE="flatpak"
  fi
fi

if [[ "$RUN_MODE" == "flatpak" ]]; then
  require_cmd flatpak
  ensure_flatpak_runtime "$FLATPAK_RUNTIME"
else
  require_cmd gjs
fi

log_info "Profil uruchomienia: mode=${RUN_MODE} gtk4=${RUN_GTK4} libadwaita=${RUN_LIBADWAITA}"

GTK4_APP="$REPO_ROOT/tools/gtk-reference/gtk4-gjs/app.js"
ADW_APP="$REPO_ROOT/tools/gtk-reference/libadwaita-gjs/app.js"

if [[ "$RUN_GTK4" == "true" ]]; then
  run_app "$GTK4_APP" "GTK4"
fi

if [[ "$RUN_LIBADWAITA" == "true" ]]; then
  run_app "$ADW_APP" "Libadwaita"
fi

wait
log_ok "Reference apps zakonczone."
