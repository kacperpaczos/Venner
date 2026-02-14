#!/usr/bin/env bash
# Venner - uruchomienie mini-viewerow (widget/theme) dla GTK4 i Libadwaita

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
init_script "viewer"

USAGE=$'Usage:\n  ./scripts/run-viewer.sh <viewer-id>\n\nViewer IDs:\n  gtk4-widget\n  adw-widget\n  venner-widget\n  gtk4-theme\n  adw-theme\n  venner-theme\n\nExamples:\n  ./scripts/run-viewer.sh gtk4-widget\n  ./scripts/run-viewer.sh adw-theme\n'

VIEWER_ID="${1:-}"
if [[ -z "$VIEWER_ID" || "$VIEWER_ID" == "--help" ]]; then
	echo "$USAGE"
	exit 0
fi

case "$VIEWER_ID" in
	gtk4-widget) APP_PATH="$REPO_ROOT/tools/viewers/gtk4-widget-viewer/app.js" ;;
	adw-widget) APP_PATH="$REPO_ROOT/tools/viewers/adw-widget-viewer/app.js" ;;
	venner-widget) APP_PATH="$REPO_ROOT/tools/viewers/venner-widget-viewer/app.js" ;;
	gtk4-theme) APP_PATH="$REPO_ROOT/tools/viewers/gtk4-theme-viewer/app.js" ;;
	adw-theme) APP_PATH="$REPO_ROOT/tools/viewers/adw-theme-viewer/app.js" ;;
	venner-theme) APP_PATH="$REPO_ROOT/tools/viewers/venner-theme-viewer/app.js" ;;
	*) die "Nieznany viewer-id: $VIEWER_ID" ;;
esac

require_cmd gjs
[[ -f "$APP_PATH" ]] || die "Brak pliku app.js: $APP_PATH"

log_info "Uruchamiam viewer: $VIEWER_ID"
cd "$REPO_ROOT"
exec gjs -m "$APP_PATH"
