# Motywy projektu (dev/test)

Pliki CSS motywów GTK – czytane przez aplikację podczas rozwoju, gdy `resources/themes` jest w workspace.

## Struktura

| Katalog | Opis | Pliki |
|---------|------|-------|
| `default-gtk3/` | Adwaita GTK3 | gtk-contained.css, gtk-contained-dark.css |
| `default-gtk4/` | Adwaita GTK4 | Default-dark.css, Default-light.css, Default-hc*.css |
| `mint-l-dark-sand-gtk3/` | Mint-L-Dark-Sand GTK3 | gtk.css, gtk-dark.css, assets/ |

## Zachowanie

1. **`VENNER_THEMES_DIR`** – nadpisuje ścieżkę do tego katalogu.
2. **`VENNER_DEV_THEME`** – wymusza motyw: `default-gtk3` | `default-gtk4` | `mint-l-dark-sand-gtk3`.
3. Bez override: mapowanie `gtk-theme` z gsettings (Adwaita → default-gtk4, Mint* → mint-l-dark-sand-gtk3).
4. Gdy brak projektu → motywy systemowe → `default_tokens()`.

## Użycie

```bash
# Domyślny motyw (default-gtk4 lub mint przy gtk-theme Mint)
cargo run -p dev

# Wymuszenie motywu
VENNER_DEV_THEME=mint-l-dark-sand-gtk3 cargo run -p dev
VENNER_DEV_THEME=default-gtk3 cargo run -p dev

# Nadpisanie ścieżki
VENNER_THEMES_DIR=/ścieżka/do/themes cargo run -p dev
```
