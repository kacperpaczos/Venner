# 05. Architektura Monorepo: Widget Framework dla Tauri

Specyfikacja warstwowa frameworka odtwarzającego wygląd i zachowanie natywnych widgetów (GTK/LibAdwaita, KDE/Breeze, Windows 11/Fluent) — wyłącznie technologiami webowymi.

## 1. Mapowanie Warstw (Stack Mapping)

Framework jest **agnostyczny** — logika widgetów jest oddzielona od frameworka UI. SolidJS jest referencyjną implementacją, ale adaptery dla React/Vue/Svelte są możliwe.

| Warstwa Konceptualna | Pakiet Venner | Odpowiedzialność |
| :--- | :--- | :--- |
| **Platform** | `packages/core` | Abstrakcja IPC (Tauri API), wykrywanie systemu, ekstrakcja motywu, clipboard, input mode detection. |
| **State Machines** | `packages/primitives` | Headless logika widgetów (Zag.js). Maszyny stanów dla Button, Switch, Window, Dialog, ListView. **Zero zależności od frameworka UI.** |
| **Visual Shell** | `packages/ui` | Minimalne szablony HTML/CSS komponentów. Definiują strukturę DOM i klasy CSS — bez logiki. |
| **Theme: GNOME** | `packages/themes/gnome` | Ekstrakcja i mapowanie zmiennych z motywu Adwaita/GTK na CSS Custom Properties. |
| **Theme: KDE** | `packages/themes/kde` | (Przyszłość) Ekstrakcja z Plasma/Breeze. |
| **Theme: Win11** | `packages/themes/win11` | (Przyszłość) Mapowanie Fluent Design tokens. |
| **SolidJS Adapter** | `packages/adapters/solid` | Bindingi łączące `primitives` + `ui` z systemem reaktywności SolidJS. **Referencyjna implementacja.** |
| **Apps** | `apps/dev` | Aplikacja deweloperska Tauri korzystająca z frameworka. |

## 2. Graf Zależności

```text
apps/dev
  └── packages/adapters/solid (@venner/solid)
        ├── packages/primitives (Headless Logic)
        │     └── packages/core (Platform Abstraction)
        └── packages/ui (Visual Shell / CSS)
              └── packages/themes/gnome (Theme Extraction)
                    └── packages/core
```

**Zasada Złota**:
*   `packages/primitives` definiuje **jak** działa widget (naciśnięcie spacji = klik) — **czyste TS, zero frameworka**.
*   `packages/ui` definiuje **jak** wygląda widget (struktura DOM, klasy CSS) — minimalne szablony.
*   `packages/themes/gnome` dostarcza **zmienne CSS** wyglądające jak Adwaita.
*   `packages/adapters/solid` **łączy** logikę z widokiem w SolidJS. Można dodać `packages/adapters/react` bez zmian w `primitives`.

## 3. Strategia Stylowania (System Extraction)

Zamiast budować własny system designu, **ekstrahoujemy** tokeny z systemu operacyjnego.

1.  **Extraction**: Rust (via `packages/core`) odczytuje aktywny motyw systemu.
2.  **Parsing**: Rust parsuje pliki motywu i wyciąga definicje kolorów, fontów, spacing.
3.  **Injection**: Zmienne CSS (`--venner-bg`, `--venner-accent`) wstrzykiwane do WebView przed startem.
4.  **Usage**: `packages/ui` używa wyłącznie zmiennych `--venner-*`. Zero hardcodowanych kolorów.

## 4. Agnostyczność Frameworkowa

*   **Zag.js** jest z natury framework-agnostic — maszyny stanów to czyste obiekty JS.
*   Każdy adapter (SolidJS, React, Vue) importuje maszynę z `@venner/primitives` i mapuje ją na reaktywność danego frameworka.
*   Testy logiki widgetów działają **bez renderowania** — w czystym Bun/Node.

## 5. Testowanie

*   **Pixel-Perfect Tests**: Porównanie screenshotów widgetów Venner vs natywnych odpowiedników (GTK, KDE, Win11).
*   **Behavior Tests**: Sprawdzenie skrótów klawiszowych, focus ring, nawigacji Tab — identyczne z natywnymi.
*   **Performance Benchmarks**: Czas tworzenia 1000/10000 wierszy, zużycie pamięci, czas startu.
