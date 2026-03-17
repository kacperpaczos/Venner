# 03. Strategia Systemu Designu: Multi-Platform Theme Extraction

Zamiast tworzyć własny język wizualny, aplikacja **ekstrahouje** tokeny designu z systemu operacyjnego hosta — wyglądając natywnie na każdej platformie.

## 1. Architektura "Theme Injection" (Multi-Platform)

**Cel**: Aplikacja ma wyglądać *native-feeling* — nieodróżnialnie od natywnych aplikacji danego systemu (GNOME/KDE/Windows 11), nawet jeśli użytkownik zmienił motyw na niestandardowy.

### 1.1. GNOME / GTK (Linux)

**Mechanizm (Rust — `@venner/core`)**:
1.  **Wykrycie**: Sprawdź zmienną `GTK_THEME` lub `gsettings`.
2.  **Lokalizacja**: Znajdź plik `gtk.css` (np. `~/.themes/Nord/gtk-4.0/gtk.css`).
3.  **Transpilacja**: `@define-color accent_color #88c0d0;` → `--venner-accent: #88c0d0;`.
4.  **Wstrzyknięcie**: Wyślij gotowy blok CSS do WebView przy starcie.

### 1.2. KDE / Plasma (Linux)

**Mechanizm (Rust — `@venner/core`)**:
1.  **Wykrycie**: Odczyt `~/.config/kdeglobals` i `~/.config/breezerc`.
2.  **Parsing**: Sekcja `[Colors:Window]`, `[Colors:Button]`, `[Colors:View]`.
3.  **Transpilacja**: `BackgroundNormal=35,38,41` → `--venner-bg: rgb(35, 38, 41);`.
4.  **Wstrzyknięcie**: Identyczny mechanizm jak GNOME.

### 1.3. Windows 11 / Fluent (Przyszłość)

**Mechanizm (Rust — `@venner/core`)**:
1.  **Wykrycie**: Odczyt rejestru `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`.
2.  **Parsing**: Accent color, dark/light mode, Mica/Acrylic.
3.  **Transpilacja**: Mapowanie Fluent Design Tokens → `--venner-*`.

## 2. Wspólny Kontrakt CSS (Venner Design Tokens)

Wszystkie motywy systemowe mapują się na **jeden zestaw** zmiennych CSS:

| Token Venner | GNOME Source | KDE Source | Win11 Source |
| :--- | :--- | :--- | :--- |
| `--venner-bg` | `@define-color window_bg_color` | `Colors:Window/BackgroundNormal` | `SystemControlBackground` |
| `--venner-fg` | `@define-color window_fg_color` | `Colors:Window/ForegroundNormal` | `SystemControlForeground` |
| `--venner-accent` | `@define-color accent_color` | `Colors:Selection/BackgroundNormal` | `AccentColorLight2` |
| `--venner-error` | `@define-color error_color` | `Colors:Window/ForegroundNegative` | `SystemFillColorCritical` |
| `--venner-radius` | Hardcoded `12px` (Adwaita) | Hardcoded `4px` (Breeze) | Hardcoded `8px` (Fluent) |
| `--venner-font` | `gsettings font-name` | `kdeglobals/General/font` | `Segoe UI Variable` |

## 3. Warstwa CSS (`packages/ui`)

Widgety w `packages/ui` używają **wyłącznie** zmiennych `--venner-*`. Zero hardcodowanych kolorów.

```css
/* packages/ui/styles/button.css */
.venner-button {
  background: var(--venner-accent);
  color: var(--venner-bg);
  border-radius: var(--venner-radius);
  font-family: var(--venner-font), system-ui, sans-serif;
  transition: opacity 150ms ease;
}
.venner-button:hover { opacity: 0.85; }
.venner-button:active { opacity: 0.7; }
```

## 4. Obsługa Ikon (Icon Theme)

**Problem**: Web używa SVG/FontAwesome. Linux używa FDO Icon Theme Spec (`/usr/share/icons`).

**Rozwiązanie w Frameworku**:
*   Nie bundlujemy ikon.
*   Implementujemy **Custom Protocol** `icon://` w `@venner/core`.
*   Żądanie `icon://folder-music` trafia do Rusta → Rust używa `linicon` → zwraca SVG.
*   Na Windows: Fallback do bundlowanych ikon Fluent lub Material.

## 5. Typografia i Fonty

**Wymóg**: Aplikacja musi używać fontu systemowego.

```css
body {
  font-family: var(--venner-font), system-ui, -apple-system, sans-serif;
  font-feature-settings: "tnum" on;
}
```
Rust odczytuje konfigurację fontu z systemu (`gsettings`, `kdeglobals`, Registry) i wstrzykuje `--venner-font` przed startem aplikacji.
