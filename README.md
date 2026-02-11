# Venner

Monorepo: Tauri 2, SolidJS, Zag.js – biblioteka do parsowania motywów GTK i wyświetlania ich w WebView.

## Konfiguracja / Development

### Zmienna `VENNER_THEMES_DIR`

Aby nadpisać ścieżkę do motywów (np. w CI lub custom setup):

```bash
VENNER_THEMES_DIR=/ścieżka/do/katalogu/motywów cargo run -p dev
```

Gdy nie jest ustawiona, Venner szuka `resources/themes` w workspace – szczegóły w [resources/themes/README.md](resources/themes/README.md).
