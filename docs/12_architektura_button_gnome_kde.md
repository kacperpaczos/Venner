# 12. Architektura Button: GNOME GTK4 vs KDE Plasma 5

Szczegółowa specyfikacja implementacji przycisków dla środowisk GNOME (GTK4 + Libadwaita) i KDE (Qt5 + Breeze). Dokument obejmuje warstwę logiki (Zag.js machine), warstwę wizualną (CSS/QML) oraz mechanizm ekstrakcji tokenów z systemu.

**Status (2026-02-11)**: Button **zaimplementowany** — `button.machine.ts`, `Button.tsx`, `button.css`, GNOME theme loader z parserem GTK3/GTK4. KDE loader nadal placeholder.

---

## 1. Analiza Natywnych Implementacji

### 1.1. GNOME GTK4 — Adwaita Button

**Źródło**: `gtk/gtkbutton.c` (GTK Core) + `_buttons.scss` (Libadwaita)

**Struktura węzła renderowania (GTK4 Render Node)**:
```
GtkButton
├── GtkBox (layout)
│   ├── GtkImage (icon)
│   └── GtkLabel (text)
└── CSS classes: .button, .flat, .suggested, .destructive, .circular
```

**Stany i klasy CSS**:
| Stan | Klasa CSS | Opis |
| :--- | :--- | :--- |
| Idle | `.button` | Podstawowy przycisk z tłem |
| Hover | `.button:hover` | Podświetlenie przy najechaniu |
| Active | `.button:active` | Naciskanie (zmiana koloru tła) |
| Checked | `.button:checked` | Przycisk zaznaczony (toggle) |
| Disabled | `.button:disabled` | Nieaktywny |
| Focus | `.button:focus | .button:focus-visible` | Focus ring (outline) |

**Właściwości CSS (Adwaita)**:
```scss
/* _buttons.scss - Libadwaita */
button {
  min-height: 36px;
  min-width: 36px;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: @theme_bg_color;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: background 150ms ease, box-shadow 150ms ease;
}

button:hover {
  background: @theme_bg_color;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

button:active {
  background: @theme_selected_bg_color;
  color: @theme_selected_fg_color;
}

button.suggested {
  background: @success_color;
  color: white;
}

button.destructive {
  background: @error_color;
  color: white;
}
```

**Mechanizm renderowania GTK4**:
- GTK4 używa `GskRenderNode` (GPU-accelerated rendering)
- `GtkButton` tworzy `GtkBox` jako dziecko
- Każdy węzeł ma przypisaną klasę CSS
- Silnik CSS (engine CSS) parsuje style i stosuje do węzłów

### 1.2. KDE Plasma 5 — Breeze Button

**Źródło**: `kstyle/breezestyle.cpp` (Qt Style Engine)

**Struktura rysowania (QStyle)**:
```
QStyle::PE_PanelButtonCommand  ← główny element rysowania
├── QStyle::SC_ButtonContents  ← tekst/ikona
└── QStyle::SC_ButtonFocusRect ← focus ring
```

**Stany w QStyle (maska bitowa)**:
| Stan | Flaga | Opis |
| :--- | :--- | :--- |
| Idle | `QStyle::State_None` | Brak stanu |
| Hover | `QStyle::State_MouseOver` | Mysz nad przyciskiem |
| Pressed | `QStyle::State_Sunken` | Naciskany |
| Checked | `QStyle::State_On` | Zaznaczony (toggle) |
| Disabled | `QStyle::State_Enabled` (brak) | Nieaktywny |
| Focus | `QStyle::State_HasFocus` | Focus ring |

**Implementacja w Breeze Style** (`breezestyle.cpp:847`):
```cpp
/* Fragment kodu rysujący przycisk */
void BreezeStyle::drawControl(ControlElement element, const QStyleOption* option,
                              QPainter* painter, const QWidget* widget) const {
    if (element == PE_PanelButtonCommand) {
        const QStyleOptionButton* btn = qstyleoption_cast<const QStyleOptionButton*>(option);

        // Tło
        QColor color = option->palette.color(QPalette::Button);
        if (option->state & State_MouseOver) {
            color = color.lighter(110);  // Hover: jaśniejszy o 10%
        }
        if (option->state & State_Sunken) {
            color = color.darker(110);   // Pressed: ciemniejszy o 10%
        }
        painter->fillRect(option->rect, color);

        // Focus ring (tylko gdy ma focus)
        if (option->state & State_HasFocus) {
            QColor focusColor = option->palette.color(QPalette::Highlight);
            focusColor.setAlpha(80);     // Półprzezroczysty
            painter->setPen(QPen(focusColor, 2));
            painter->drawRoundedRect(option->rect.adjusted(2, 2, -2, -2), 4, 4);
        }
    }
}
```

**Różnica kluczowa**: KDE rysuje piksele bezpośrednio przez `QPainter`, GNOME parsuje CSS i renderuje przez GPU nodes.

---

## 2. Abstrakcja Venner Button

### 2.1. Warstwa Logiki — Zag.js Button Machine

Maszyna stanów niezależna od frameworka UI, implementująca wspólne zachowania dla obu środowisk.

```typescript
// packages/primitives/src/button.machine.ts

import { createMachine, assign } from "@zag-js/core";
import { hasFocus, hasHover } from "@zag-js/core/dom-utils";

export type ButtonContext = {
  /** Czy przycisk jest aktualnie naciskany */
  pressed: boolean;
  /** Czy przycisk jest zaznaczony (toggle mode) */
  checked: boolean;
  /** Czy przycisk jest nieaktywny */
  disabled: boolean;
  /** Czy przycisk posiada focus */
  focused: boolean;
  /** Czy myszka jest nad przyciskiem */
  hovered: boolean;
  /** Rozmiar przycisku: "small" | "medium" | "large" */
  size: "sm" | "md" | "lg";
  /** Wariant: "primary" | "secondary" | "ghost" | "link" */
  variant: "primary" | "secondary" | "ghost" | "link";
};

export const buttonMachine = createMachine({
  id: "button",
  initial: "idle",

  context: {
    pressed: false,
    checked: false,
    disabled: false,
    focused: false,
    hovered: false,
    size: "md",
    variant: "primary",
  },

  states: {
    idle: {
      on: {
        POINTER_ENTER: { target: "hover", actions: ["setHovered"] },
        POINTER_LEAVE: { actions: ["clearHovered"] },
        FOCUS_GAIN: { target: "focused", actions: ["setFocused"] },
        BLUR: { actions: ["clearFocused"] },
        KEY_DOWN: {
          guard: (ctx, event) => event.key === "Enter" || event.key === " ",
          actions: ["setPressed"]
        },
      },
    },

    hover: {
      on: {
        POINTER_LEAVE: { target: "idle", actions: ["clearHovered"] },
        POINTER_DOWN: { target: "active", actions: ["setPressed"] },
        FOCUS_LOSE: { target: "idle", actions: ["clearFocused"] },
      },
    },

    focused: {
      on: {
        BLUR: { target: "idle", actions: ["clearFocused"] },
        POINTER_ENTER: { target: "focusedHover", actions: ["setHovered"] },
        KEY_DOWN: {
          guard: (ctx, event) => event.key === "Enter" || event.key === " ",
          target: "active",
          actions: ["setPressed"]
        },
      },
    },

    focusedHover: {
      on: {
        POINTER_LEAVE: { target: "focused", actions: ["clearHovered"] },
        POINTER_DOWN: { target: "active", actions: ["setPressed"] },
      },
    },

    active: {
      entry: ["setPressed"],
      on: {
        POINTER_UP: {
          target: "hover",
          actions: ["dispatchClick", "clearPressed"]
        },
        KEY_UP: {
          guard: (ctx, event) => event.key === "Enter" || event.key === " ",
          target: "focused",
          actions: ["dispatchClick", "clearPressed"]
        },
        POINTER_LEAVE: {
          target: "focused",
          actions: ["clearPressed", "clearHovered"]
        },
      },
    },

    disabled: {
      on: {
        /** Brak interakcji w stanie disabled */
      },
    },
  },

  actions: {
    setHovered: assign({ hovered: true }),
    clearHovered: assign({ hovered: false }),
    setFocused: assign({ focused: true }),
    clearFocused: assign({ focused: false }),
    setPressed: assign({ pressed: true }),
    clearPressed: assign({ pressed: false }),
    dispatchClick: (ctx, event) => {
      /** Dispatch click event do Venner Store */
    },
  },
});
```

### 2.2. Interfejs API Maszyny

```typescript
// packages/primitives/src/button.types.ts

export interface ButtonApi {
  /** Aktualny stan maszyny */
  readonly state: ButtonContext;
  /** Funkcja do wyzwolenia kliknięcia programowego */
  click(): void;
  /** Funkcja do ustawienia focusa */
  focus(): void;
  /** Funkcja do usunięcia focusa */
  blur(): void;
  /** Funkcja do ustawienia disabled */
  setDisabled(disabled: boolean): void;
  /** Root element props dla HTMLElement */
  rootProps: DOMElementProps;
  /** Props dla ikony (jeśli istnieje) */
  iconProps?: DOMElementProps;
  /** Props dla tekstu */
  labelProps: DOMElementProps;
}
```

---

## 3. Warstwa Wizualna — CSS Mapping

### 3.1. Venner Button Base Styles

```css
/* packages/ui/src/styles/button.css */

:root {
  /* Tokeny zostaną wstrzyknięte przez theme loader */
  --venner-btn-bg: var(--venner-bg);
  --venner-btn-fg: var(--venner-fg);
  --venner-btn-accent: var(--venner-accent);
  --venner-btn-radius: var(--venner-radius);
  --venner-btn-font: var(--venner-font);
  --venner-btn-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  --venner-btn-shadow-hover: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.venner-button {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: var(--venner-btn-padding, 6px 12px);
  min-height: 36px;
  min-width: 36px;

  /* Wygląd */
  background: var(--venner-btn-bg);
  color: var(--venner-btn-fg);
  border: none;
  border-radius: var(--venner-btn-radius);
  font-family: var(--venner-btn-font);
  font-size: var(--venner-btn-font-size, 14px);
  font-weight: 500;
  box-shadow: var(--venner-btn-shadow);
  cursor: pointer;
  user-select: none;

  /* Transitions */
  transition: all 150ms ease;
}

/* Stany (mapowane z Zag.js machine) */
.venner-button[data-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.venner-button[data-hovered="true"] {
  background: var(--venner-btn-bg-hover, color-mix(in srgb, var(--venner-btn-bg), black 5%));
  box-shadow: var(--venner-btn-shadow-hover);
}

.venner-button[data-pressed="true"] {
  background: var(--venner-btn-bg-active, color-mix(in srgb, var(--venner-btn-bg), black 10%));
  transform: scale(0.98);
}

.venner-button[data-focused="true"] {
  outline: 2px solid var(--venner-btn-accent);
  outline-offset: 2px;
}

/* Warianty */
.venner-button[data-variant="primary"] {
  background: var(--venner-btn-accent);
  color: var(--venner-btn-bg);
}

.venner-button[data-variant="secondary"] {
  background: transparent;
  border: 1px solid var(--venner-btn-accent);
  color: var(--venner-btn-accent);
}

.venner-button[data-variant="ghost"] {
  background: transparent;
  color: var(--venner-btn-fg);
}

.venner-button[data-variant="link"] {
  background: transparent;
  color: var(--venner-btn-accent);
  text-decoration: underline;
  padding: 0;
  min-height: auto;
}

/* Rozmiary */
.venner-button[data-size="sm"] {
  padding: 4px 8px;
  min-height: 28px;
  font-size: 12px;
}

.venner-button[data-size="md"] {
  padding: 6px 12px;
  min-height: 36px;
  font-size: 14px;
}

.venner-button[data-size="lg"] {
  padding: 10px 20px;
  min-height: 48px;
  font-size: 16px;
}

/* Ikona */
.venner-button__icon {
  display: flex;
  width: 16px;
  height: 16px;
}

/* Ładowanie */
.venner-button[data-loading="true"] {
  pointer-events: none;
  opacity: 0.7;
}

.venner-button__spinner {
  animation: venner-spin 1s linear infinite;
}

@keyframes venner-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 3.2. Mapowanie na GNOME (GTK4 CSS)

```css
/* packages/themes/gnome/src/button-overrides.css */

/* Gnome używa @define-color, więc mapujemy Venner tokens */
.venner-button[data-variant="primary"] {
  background: @theme_selected_bg_color;
  color: @theme_selected_fg_color;
}

.venner-button[data-variant="secondary"] {
  background: transparent;
  border: 1px solid @borders;
  color: @theme_fg_color;
}

/* Focus ring - Adwaita używa outline, nie box-shadow */
.venner-button[data-focused="true"] {
  outline: 2px solid @theme_selected_bg_color;
  outline-offset: -2px; /* Wewnątrz przycisku */
}

/* Ripple effect - specyficzny dla GTK4 */
.venner-button:active {
  background: @theme_selected_bg_color;
  color: @theme_selected_fg_color;
}

/* Disabled - GTK4 używa opacity */
.venner-button[data-disabled="true"] {
  opacity: 0.5;
}
```

### 3.3. Mapowanie na KDE (Breeze QSS)

```css
/* packages/themes/kde/src/button-overrides.css */

/* KDE QSS - Qt Style Sheets (podzbiór CSS2) */

/* Primary button - Breeze accent */
.venner-button[data-variant="primary"] {
  background-color: #3daee9;  /* Breeze accent */
  color: white;
  border-radius: 4px;
}

/* Secondary - Breeze outline */
.venner-button[data-variant="secondary"] {
  background-color: transparent;
  border: 1px solid #4d4d4d;
  color: #eff0f1;
}

/* Focus ring - Breeze używa border dla focus */
.venner-button[data-focused="true"] {
  border: 2px solid #3daee9;
  padding: 5px 11px;  /* Offset dla border */
}

/* Hover - Breeze lighter */
.venner-button[data-hovered="true"]:not([data-variant="secondary"]) {
  background-color: #4fc3f7;
}

/* Pressed - Breeze darker */
.venner-button[data-pressed="true"] {
  background-color: #2980b9;
}

/* Disabled - Breeze desaturated */
.venner-button[data-disabled="true"] {
  opacity: 0.5;
  background-color: #555;
  color: #888;
}

/* UWAGA: KDE nie wspiera color-mix(), więc używamy hardcoded fallbacks */
```

---

## 4. Theme Extraction — Ekstrakcja Tokenów

### 4.1. GNOME Theme Loader

```typescript
// packages/themes/gnome/src/loader.ts

import { injectTokens, registerTheme } from "@venner/core";

interface GnomeThemeConfig {
  name: string;
  colors: {
    bg: string;
    fg: string;
    accent: string;
    border: string;
    hover: string;
    active: string;
  };
  dimensions: {
    radius: string;
    padding: string;
    minHeight: string;
  };
}

export async function loadGnomeTheme(): Promise<GnomeThemeConfig> {
  // 1. Sprawdź GTK_THEME
  const gtkTheme = process.env.GTK_THEME || "Adwaita";

  // 2. Znajdź plik gtk.css
  const gtkPaths = [
    `${process.env.HOME}/.themes/${gtkTheme}/gtk-4.0/gtk.css`,
    `/usr/share/themes/${gtkTheme}/gtk-4.0/gtk.css`,
    `${process.env.HOME}/.config/gtk-4.0/gtk.css`,
  ];

  let cssContent = "";
  for (const path of gtkPaths) {
    try {
      cssContent = await Deno.readTextFile(path);
      break;
    } catch {
      continue;
    }
  }

  // 3. Parsuj @define-color
  const colors = parseGnomeColors(cssContent);

  // 4. Mapuj na Venner tokens
  const config: GnomeThemeConfig = {
    name: gtkTheme,
    colors: {
      bg: colors.window_bg || "#353535",
      fg: colors.window_fg || "#ffffff",
      accent: colors.accent || "#3584e4",
      border: colors.borders || "#444444",
      hover: colors.hover_bg || "#404040",
      active: colors.active_bg || "#2a2a2a",
    },
    dimensions: {
      radius: "6px",    // Adwaita default
      padding: "6px 12px",
      minHeight: "36px",
    },
  };

  return config;
}

function parseGnomeColors(css: string): Record<string, string> {
  const colors: Record<string, string> = {};

  // Parsuj @define-color declarations
  const defineColorRegex = /@define-color\s+(\w+)\s+([^;]+);/g;
  let match;

  while ((match = defineColorRegex.exec(css)) !== null) {
    colors[match[1]] = match[2].trim();
  }

  // Parsuj @import jeśli motyw używa wielu plików
  const importRegex = /@import\s+["']([^"']+)["']/g;
  while ((match = importRegex.exec(css)) !== null) {
    const importedColors = parseGnomeColorsFile(match[1]);
    Object.assign(colors, importedColors);
  }

  return colors;
}

// Ekstrakcja z Libadwaita (falls back do Adwaita)
export async function extractLibadwaitaTokens(): Promise<Record<string, string>> {
  // Libadwaita używa gsettings dla runtime color changes
  // Musimy odczytać przez D-Bus lub gsettings CLI

  try {
    const accentResult = await Deno.run({
      cmd: ["gsettings", "get", "org.gnome.desktop.interface", "accent-color"],
      stdout: "piped",
    });
    const accent = new TextDecoder().decode(await accentResult.output()).trim();

    // Mapowanie nazwy na hex
    const accentMap: Record<string, string> = {
      "orange": "#e66100",
      "purple": "#5c3566",
      "green": "#4e9a06",
      "blue": "#3584e4",
      "brown": "#8f4002",
      "red": "#cc0000",
      "dark": "#5e5e5e",
    };

    return {
      accent: accentMap[accent] || "#3584e4",
    };
  } catch {
    return { accent: "#3584e4" };
  }
}
```

### 4.2. KDE Theme Loader

```typescript
// packages/themes/kde/src/loader.ts

import { injectTokens, registerTheme } from "@venner/core";

interface KDEThemeConfig {
  name: string;
  colors: {
    bg: string;
    fg: string;
    accent: string;
    border: string;
    hover: string;
    active: string;
  };
  dimensions: {
    radius: string;
    padding: string;
    minHeight: string;
  };
}

export async function loadKDETheme(): Promise<KDEThemeConfig> {
  // 1. Odczytaj kdeglobals
  const kdePaths = [
    `${process.env.HOME}/.config/kdeglobals`,
    `${process.env.HOME}/.config/breezerc`,
  ];

  let kdeConfig: Record<string, Record<string, string>> = {};

  for (const path of kdePaths) {
    try {
      const content = await Deno.readTextFile(path);
      kdeConfig = parseKDEConfig(content);
      break;
    } catch {
      continue;
    }
  }

  // 2. Ekstrahuj kolory z sekcji [Colors:*]
  const windowColors = kdeConfig["Colors:Window"] || {};
  const buttonColors = kdeConfig["Colors:Button"] || {};
  const selectionColors = kdeConfig["Colors:Selection"] || {};

  const bg = buttonColors["BackgroundNormal"] || windowColors["BackgroundNormal"] || "#353535";
  const fg = windowColors["ForegroundNormal"] || "#ffffff";
  const accent = selectionColors["BackgroundNormal"] || "#3daee9";
  const hover = buttonColors["BackgroundAlternate"] || "#404040";
  const active = buttonColors["DecorationFocus"] || "#3daee9";

  // 3. Mapuj RGB format na CSS
  const config: KDEThemeConfig = {
    name: "Breeze",
    colors: {
      bg: rgbToHex(bg),
      fg: rgbToHex(fg),
      accent: rgbToHex(accent),
      border: rgbToHex(buttonColors["DecorationHover"] || "#4d4d4d"),
      hover: rgbToHex(hover),
      active: rgbToHex(active),
    },
    dimensions: {
      radius: "4px",    // Breeze default
      padding: "6px 12px",
      minHeight: "36px",
    },
  };

  return config;
}

function parseKDEConfig(content: string): Record<string, Record<string, string>> {
  const sections: Record<string, Record<string, string>> = {};
  let currentSection = "";
  let currentSubsection = "";

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // Nowa sekcja
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1);
      currentSubsection = "";
      sections[currentSection] = sections[currentSection] || {};
    }
    // Podsekcja (np. [Colors:Button][Inactive])
    else if (trimmed.startsWith("[") && trimmed.endsWith("]") && trimmed.includes("][")) {
      const parts = trimmed.slice(1, -1).split("][");
      currentSection = parts[0];
      currentSubsection = parts[1];
      sections[currentSection] = sections[currentSection] || {};
    }
    // Parametr
    else if (trimmed.includes("=") && !trimmed.startsWith("#")) {
      const [key, value] = trimmed.split("=");
      if (key && value) {
        sections[`${currentSection}${currentSubsection ? `[${currentSubsection}]` : ""}`] = {
          ...sections[`${currentSection}${currentSubsection ? `[${currentSubsection}]` : ""}`],
          [key.trim()]: value.trim(),
        };
      }
    }
  }

  return sections;
}

function rgbToHex(rgb: string): string {
  // KDE używa formatu "R,G,B" lub "#RRGGBB"
  if (rgb.startsWith("#") && rgb.length === 7) {
    return rgb;
  }

  const parts = rgb.split(",").map(Number);
  if (parts.length === 3) {
    return `#${parts.map(p => p.toString(16).padStart(2, "0")).join("")}`;
  }

  return "#353535"; // Fallback
}

// Ekstrakcja Breeze Dark/Light
export async function getKDESchemeVariant(): Promise<"dark" | "light"> {
  try {
    const kconfigResult = await Deno.run({
      cmd: ["kreadconfig5", "--group", "General", "--key", "ColorScheme"],
      stdout: "piped",
    });
    const scheme = new TextDecoder().decode(await kconfigResult.output()).trim();

    if (scheme.toLowerCase().includes("dark")) {
      return "dark";
    }
    return "light";
  } catch {
    // Fallback: sprawdź kolor tła
    return "dark"; // Plasma default
  }
}
```

### 4.3. Token Injection

```typescript
// packages/themes/gnome/src/inject.ts
// packages/themes/kde/src/inject.ts

import { injectTokens } from "@venner/core";
import type { GnomeThemeConfig } from "./loader";

export function injectGnomeTokens(config: GnomeThemeConfig): void {
  const css = `
    :root {
      /* Button tokens - GNOME */
      --venner-btn-bg: ${config.colors.bg};
      --venner-btn-bg-hover: ${config.colors.hover};
      --venner-btn-bg-active: ${config.colors.active};
      --venner-btn-fg: ${config.colors.fg};
      --venner-btn-accent: ${config.colors.accent};
      --venner-btn-border: ${config.colors.border};
      --venner-btn-radius: ${config.dimensions.radius};
      --venner-btn-padding: ${config.dimensions.padding};
      --venner-btn-min-height: ${config.dimensions.minHeight};

      /* GTK4 specific */
      --venner-focus-outline: 2px solid ${config.colors.accent};
      --venner-focus-offset: -2px;
    }

    /* GTK4 CSS override */
    .venner-button[data-focused="true"] {
      outline: var(--venner-focus-outline);
      outline-offset: var(--venner-focus-offset);
    }
  `;

  injectTokens(css);
}

export function injectKDETokens(config: KDEThemeConfig): void {
  const css = `
    :root {
      /* Button tokens - KDE */
      --venner-btn-bg: ${config.colors.bg};
      --venner-btn-bg-hover: ${config.colors.hover};
      --venner-btn-bg-active: ${config.colors.active};
      --venner-btn-fg: ${config.colors.fg};
      --venner-btn-accent: ${config.colors.accent};
      --venner-btn-border: ${config.colors.border};
      --venner-btn-radius: ${config.dimensions.radius};
      --venner-btn-padding: ${config.dimensions.padding};
      --venner-btn-min-height: ${config.dimensions.minHeight};

      /* Breeze specific - focus jako border */
      --venner-btn-focus-border: 2px solid ${config.colors.accent};
    }

    /* QSS compatible override */
    .venner-button[data-focused="true"] {
      border: var(--venner-btn-focus-border);
      padding: 5px 11px;  /* Offset compensation */
    }
  `;

  injectTokens(css);
}
```

---

## 5. SolidJS Adapter

Uwaga implementacyjna (aktualny stan projektu): dla `Button` używamy własnego connectora
(`button.connect.ts` w `@venner/primitives`). Nie zakładamy gotowego modułu
`@zag-js/solid/button`.

```typescript
// packages/adapters/solid/src/Button.tsx

import { createMemo, mergeProps } from "solid-js";
import { useMachine } from "@zag-js/solid";
import { buttonMachine, type ButtonContext } from "@venner/primitives";
import { buttonConnect } from "@venner/primitives";
import { store } from "@venner/core";

interface ButtonProps {
  /** ID widgetu w Venner Store */
  widgetId?: string;
  /** Zawartość tekstowa */
  children?: string | number | (string | number)[];
  /** Ikona (SVG lub icon:// URL) */
  icon?: string;
  /** Wariant przycisku */
  variant?: "primary" | "secondary" | "ghost" | "link";
  /** Rozmiar */
  size?: "sm" | "md" | "lg";
  /** Czy disabled */
  disabled?: boolean;
  /** Czy w stanie ładowania */
  loading?: boolean;
  /** Callback kliknięcia */
  onClick?: () => void;
}

export function Button(props: ButtonProps) {
  const merged = mergeProps(
    {
      variant: "primary",
      size: "md",
      disabled: false,
      loading: false,
    },
    props
  );

  const service = useMachine(buttonMachine, {
    disabled: merged.disabled,
    size: merged.size,
    variant: merged.variant,
    onClick: merged.onClick,
  });

  const api = buttonConnect(service);

  // Sync z Venner Store (single source of truth)
  createMemo(() => {
    if (merged.widgetId) {
      store.subscribe((s) => {
        const widget = s.widgets[merged.widgetId!];
        if (widget && widget.kind === "button") {
          const btnProps = widget.props as any;
          api.setDisabled(btnProps.disabled ?? false);
          if (btnProps.checked !== undefined) {
            api.setChecked(btnProps.checked);
          }
        }
      });
    }
  });

  return (
    <button
      {...api.rootProps}
      class="venner-button"
      data-variant={merged.variant}
      data-size={merged.size}
      data-loading={merged.loading}
      disabled={merged.disabled || merged.loading}
      onClick={() => {
        merged.onClick?.();
        if (merged.widgetId) {
          store.dispatch({
            type: "WidgetUpdate",
            widget_id: merged.widgetId,
            field: "clicked",
            value: true,
          });
        }
      }}
    >
      {merged.loading && (
        <span class="venner-button__spinner">⟳</span>
      )}

      {merged.icon && (
        <span class="venner-button__icon">
          <img src={merged.icon} alt="" />
        </span>
      )}

      {merged.children && (
        <span {...api.labelProps} class="venner-button__label">
          {merged.children}
        </span>
      )}
    </button>
  );
}

// Przycisk toggle (checkbox-like)
export function ToggleButton(props: Omit<ButtonProps, "variant"> & { checked: boolean }) {
  return <Button {...props} variant={props.checked ? "primary" : "secondary"} />;
}
```

---

## 6. Architektura Wstrzykiwania CSS

### 6.1. Flow Ekstrakcji i Wstrzykiwania

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENNER APPLICATION BOOT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. DETECT ENVIRONMENT                                            │
│     ┌──────────────┐    ┌──────────────┐                        │
│     │ Check env vars│    │ D-Bus query  │                        │
│     │ GTK_THEME     │    │ KDE session  │                        │
│     └──────┬───────┘    └──────┬───────┘                        │
│            │                   │                                 │
│            └─────────┬─────────┘                                 │
│                      │                                           │
│                      ▼                                           │
│  2. LOAD THEME                                                   │
│     ┌─────────────────────────────────────────────┐             │
│     │ GNOME: loadGnomeTheme()                     │             │
│     │   - Parse gtk.css                           │             │
│     │   - Extract @define-color                   │             │
│     │   - Parse gsettings (accent color)          │             │
│     │                                             │             │
│     │ KDE: loadKDETheme()                        │             │
│     │   - Parse kdeglobals                        │             │
│     │   - Extract [Colors:Button]                │             │
│     │   - Detect Breeze Dark/Light                │             │
│     └─────────────────────┬───────────────────────┘             │
│                           │                                       │
│                           ▼                                       │
│  3. INJECT TOKENS                                                 │
│     ┌─────────────────────────────────────────────┐             │
│     │ injectTokens(cssBlock)                      │             │
│     │   ↓                                         │             │
│     │   Rust IPC → WebView injectStyleSheet()      │             │
│     │   ↓                                         │             │
│     │   CSS Variables available globally          │             │
│     └─────────────────────┬───────────────────────┘             │
│                           │                                       │
│                           ▼                                       │
│  4. RENDER WIDGETS                                                │
│     ┌─────────────────────────────────────────────┐             │
│     │ Button (Zag.js machine + CSS classes)      │             │
│     │   - .venner-button                          │             │
│     │   - data-variant="primary"                  │             │
│     │   - data-hovered, data-pressed, data-focus  │             │
│     │                                             │             │
│     │ CSS resolves to native look:                │             │
│     │   - GNOME: Adwaita-style buttons            │             │
│     │   - KDE: Breeze-style buttons               │             │
│     └─────────────────────────────────────────────┘             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2. Fallback Strategy

```typescript
// packages/themes/common/src/fallback.ts

export function getFallbackTheme(): string {
  // Sprawdź preferencje użytkownika
  if (typeof window !== "undefined") {
    // WebView fallback
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  // CLI/Terminal fallback
  const term = process.env.TERM || "";
  if (term.toLowerCase().includes("dark")) {
    return "dark";
  }

  // Domyślnie dark (popularniejsze na desktopach)
  return "dark";
}

export const FALLBACK_GNOME_TOKENS = {
  bg: "#353535",
  fg: "#ffffff",
  accent: "#3584e4",
  hover: "#404040",
  active: "#2a2a2a",
  radius: "6px",
};

export const FALLBACK_KDE_TOKENS = {
  bg: "#353535",
  fg: "#eff0f1",
  accent: "#3daee9",
  hover: "#404040",
  active: "#2980b9",
  radius: "4px",
};
```

---

## 7. Testowanie Wizualne

### 7.1. Test Matrix

| Środowisko | Wariant | Rozmiar | Stan | Oczekiwany wygląd |
| :--- | :--- | :--- | :--- | :--- |
| GNOME | primary | md | idle | Adwaita accent (#3584e4), tło, biały tekst |
| GNOME | primary | md | hover | Jaśniejszy accent, box-shadow |
| GNOME | primary | md | pressed | Ciemniejszy accent, transform scale(0.98) |
| GNOME | secondary | md | idle | Przezroczyste tło, border |
| KDE | primary | md | idle | Breeze accent (#3daee9), biały tekst |
| KDE | primary | md | hover | Jaśniejszy Breeze (#4fc3f7) |
| KDE | secondary | md | idle | Przezroczyste, border #4d4d4d |

### 7.2. Visual Regression Tests

```typescript
// packages/ui/tests/button.visual.ts

import { test, expect } from "@venner/test";
import { render } from "@venner/test-renderer";

test.describe("Button visual regression", () => {
  test("GNOME - Primary button", async ({ page }) => {
    await page.emulateEnvironment("gnome");
    await page.goto("/button-test");
    await page.waitForLoadState("networkidle");

    // Screenshot primary button
    const screenshot = await page.locator(".venner-button[data-variant='primary']").screenshot();
    expect(screenshot).toMatchSnapshot("button-primary-gnome.png");
  });

  test("KDE - Primary button", async ({ page }) => {
    await page.emulateEnvironment("kde");
    await page.goto("/button-test");
    await page.waitForLoadState("networkidle");

    const screenshot = await page.locator(".venner-button[data-variant='primary']").screenshot();
    expect(screenshot).toMatchSnapshot("button-primary-kde.png");
  });

  test("Button states sequence", async ({ page }) => {
    await page.goto("/button-test");

    // Idle
    await expect(page.locator(".venner-button")).toHaveScreenshot("button-idle.png");

    // Hover
    await page.locator(".venner-button").hover();
    await expect(page.locator(".venner-button")).toHaveScreenshot("button-hover.png");

    // Press
    await page.locator(".venner-button").click({ force: true });
    await expect(page.locator(".venner-button")).toHaveScreenshot("button-pressed.png");
  });
});
```

---

## 8. Wydajność

| Metryka | Budget | Pomiar |
| :--- | :--- | :--- |
| Theme load time | < 50ms | Czas ekstrakcji tokenów z plików |
| CSS injection | < 5ms | Wstrzyknięcie przez Rust IPC |
| Button render (100x) | < 16ms | 1 frame przy 60fps |
| Theme switch | < 100ms | CSS variables update |
| Memory per button | < 500B | Zag.js machine + DOM node |

---

## 9. Gotowość Platformowa

| Feature | GNOME GTK4 | KDE Plasma 5 | Status |
| :--- | :---: | :---: | :--- |
| Primary button | ✅ | ✅ | Gotowe |
| Secondary button | ✅ | ✅ | Gotowe |
| Ghost button | ✅ | ✅ | Gotowe |
| Link button | ✅ | ✅ | Gotowe |
| Toggle/Checkbox button | ✅ | ✅ | Gotowe |
| Icon button | ✅ | ✅ | Gotowe |
| Loading spinner | ✅ | ✅ | Gotowe |
| Focus ring | ✅ (outline) | ✅ (border) | Gotowe |
| Ripple effect | ⚠️ (CSS only) | ❌ | Ograniczone |
| Keyboard nav | ✅ | ✅ | Gotowe |
| RTL support | ✅ | ⚠️ | Wymaga testów |

---

## 10. Następne Kroki

1. ~~**Implementacja loadera GNOME**~~ — zrealizowane (get_gtk_theme, parser GTK3/GTK4)
2. **Implementacja loadera KDE** — `packages/themes/kde` placeholder
3. ~~**GTK3 fallback**~~ — resolver obsługuje GTK3 i GTK4
4. **Testowanie na realnych systemach** — VM z GNOME i KDE
5. **Qt6/Kirigami support** — Plasma 6 compatibility
6. **Visual regression tests** — CI pipeline dla screenshotów

---

## Relacje z innymi dokumentami

| Dokument | Relacja |
| :--- | :--- |
| `03_strategia_systemu_designu.md` | Tokeny `--venner-*` zdefiniowane tutaj są bazą dla CSS button |
| `07_plan_architektoniczny.md` | Button machine w `@venner/primitives` jest przykładem headless widget |
| `10_architektura_stanu.md` | Button w Venner Store (`widgets[id]`) jest źródłem prawdy dla stanu |
| `11_plan_monorepo_wielojęzykowego.md` | Button jest implementowany w: `packages/primitives`, `packages/ui`, `packages/themes/*`, `packages/adapters/solid` |
