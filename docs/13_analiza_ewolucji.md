# 13. Analiza Ewolucji: Visage Old vs Venner New

Szczegółowa analiza ewolucji architektury od prototypu `visage_old` (React + Tauri v1) do `venner` (Rust + SolidJS + Zag.js + Tauri v2).

---

## 1. Struktura Katalogów

### 1.1. Visage Old (2024) — Monolityczna

```
visage_old/
├── src/
│   ├── Window/          ← Wrapper na Tauri window
│   ├── Page/            ← Kontener treści
│   ├── LoadingBar/      ← Komponent UI
│   │   └── types/knight-rider/
│   ├── OSD/headerBar/  ← Header bar
│   └── mian.js          ← Entry point
├── lib/                 ← Output Babel
├── package.json         ← React 18 + Tauri 1.x
└── babel.config.json
```

**Charakterystyka**:
- **Monolityczna struktura** — wszystko w jednym folderze `src/`
- **Brak podziału na pakiety** — brak możliwości reużywania kodu
- **Pojedynczy framework** — tylko React
- **Tylko CSS Modules** — brak CSS variables, preprocessorów

### 1.2. Venner New (2026) — Monorepo Wielojęzykowe

```
venner/                          # [ROOT]
├── apps/
│   └── dev/                     # Developer playground
├── crates/                      # [RUST WORKSPACE]
│   ├── venner_core/             # Rust store, IPC, Tauri API
│   └── venner_macros/           # Procedural macros
├── packages/                    # [JS WORKSPACE]
│   ├── core/                    # JS client, types, IPC wrappers
│   ├── primitives/              # Zag.js headless machines
│   ├── ui/                      # CSS templates, tokens
│   ├── themes/                  # Theme bridges
│   │   ├── gnome/
│   │   └── kde/
│   └── adapters/
│       └── solid/               # SolidJS components
├── tooling/
│   └── scripts/codegen.sh       # Rust → TS code generation
├── Cargo.toml
├── package.json                 # Bun workspace
└── turbo.json                  # Task orchestration
```

**Charakterystyka**:
- **Separacja concerns** — logika (Rust), UI (TS), style (CSS)
- **Framework agnostic** — primitives można używać z dowolnym frameworkiem
- **Multi-platform** — natywne theme extraction dla GNOME/KDE
- **Build-time + runtime** — Rust dla wydajności, JS dla elastyczności

---

## 2. Porównanie Technologiczne

| Aspekt | Visage Old | Venner New |
| :--- | :--- | :--- |
| **Język backend** | ❌ Brak (tylko Tauri CLI) | Rust (venner_core) |
| **State Management** | ❌ useState + useEffect | Zag.js machines + Rust Store |
| **Framework UI** | React 18 | SolidJS (adapter) + opcjonalnie React |
| **Build System** | Babel | Bun + Turbo + Cargo |
| **Theme System** | ❌ Brak (hardcoded CSS) | CSS Variables + Theme Extraction |
| **Native Integration** | Podstawowa (getCurrent, center) | Pełna (IPC, menu, dialogs) |
| **Code Generation** | ❌ Brak | Specta (Rust → TS types) |
| **Platform Detection** | ❌ Brak | Auto-detect GNOME/KDE |

---

## 3. Analiza Komponentów

### 3.1. Window Component

**Visage Old** (`src/Window/Window.jsx`):
```tsx
function Window({ children, position, onLoaded }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const currentWindow = await getCurrent();
        if (position === 'center') {
            await currentWindow.center();
        }
    }, [position]);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (isVisible && onLoaded) {
            const timer = setTimeout(() => onLoaded(), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onLoaded]);

    return (
        <main className={`${styles.window} ${isVisible ? styles.visible : ''}`}>
            {children}
        </main>
    );
}
```

**Problemy**:
- **Mix concerns** — animacja, pozycjonowanie, callbacki w jednym komponencie
- **useState spaghetti** — 3 stany (isVisible, timer, position)
- **Brak separacji** — Window wie o wszystkim (Tauri API, animacje, callbacks)
- **Nietestowalne** — trudne do unit testowania

**Venner New** (architektura rozproszona):
```
Window responsibilities:
├── @venner/core:        Window lifecycle API (Tauri v2)
├── @venner/primitives:  Window machine (Zag.js)
├── @venner/ui:          .venner-window CSS
├── @venner/themes:      Window tokens z systemu
└── @venner/solid:       Window component (adapter)
```

```tsx
// packages/adapters/solid/src/Window.tsx
export function Window(props) {
    const api = windowMachine.connect(state, send);
    const { children, ...rest } = props;

    return (
        <main {...api.rootProps} class="venner-window">
            {children}
        </main>
    );
}
```

**Zalety**:
- **Single Responsibility** — każda warstwa robi jedną rzecz
- **Testowalne** — maszyna stanów testowalna bez UI
- **Reużywalne** — adapter dla dowolnego frameworka
- **Theme-aware** — wygląd z natywnego systemu

### 3.2. Loading Bar

**Visage Old** (`src/LoadingBar/LoadingBar.jsx`):
```tsx
function LoadingBar({ value, maxValue, onProgressComplete, indeterminate, type = 'normal' }) {
    const isIndeterminate = indeterminate || value === undefined;
    const progressValue = isIndeterminate ? undefined : (value / maxValue) * 100;

    if (!isIndeterminate && progressValue >= 100) {
        onProgressComplete();
    }

    if (type === 'infinite') {
        return <div>Not implemented yet</div>;
    } else if (type === 'knight-rider') {
        return <KnightRider />;
    } else {
        return (
            <div className={styles.progress}>
                <div className={styles.indicator} style={{ width: `${progressValue}%` }}></div>
            </div>
        );
    }
}
```

**Problemy**:
- **Props drilling** — value, maxValue, onProgressComplete przechodzą przez wszystkie typy
- **Magic values** — `type === 'knight-rider'` hardcoded
- **Brak abstrakcji** — każdy typ musi być w tym samym pliku
- **Side effects w render** — `onProgressComplete()` w warunku

**Venner New** (rozproszona architektura):
```
LoadingBar responsibilities:
├── @venner/primitives:  loading.machine.ts (states: idle, loading, complete)
├── @venner/ui:          .venner-loading CSS (types: determinate, indeterminate, inline)
└── @venner/themes:      Loading tokens z systemu
```

```tsx
// packages/adapters/solid/src/LoadingBar.tsx
export function Progress(props: ProgressProps) {
    const [state, send] = useMachine(progressMachine, {
        context: { value: props.value, max: props.max }
    });
    const api = progressConnect(state, send);

    return (
        <div {...api.rootProps} class="venner-progress">
            <div {...api.trackProps} class="venner-progress-track">
                <div {...api.fillProps} class="venner-progress-fill" />
            </div>
        </div>
    );
}
```

### 3.3. Styling

**Visage Old** — CSS Modules + Inline styles:
```css
/* Window.module.css */
@keyframes fadeInScale {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
}
.window {
    opacity: 0;
    transform: scale(0.9);
    animation: fadeInScale 0.3s ease-in-out forwards;
}
```

**Problemy**:
- **Brak zmiennych** — wszystko hardcoded (0.3s, scale(0.9))
- **Brak theming** — brak możliwości zmiany motywu
- **Brak design tokens** — brak spójności między komponentami

**Venner New** — CSS Variables + Theme Injection:
```css
/* packages/ui/src/styles/window.css */
.venner-window {
    background: var(--venner-bg);
    color: var(--venner-fg);
    border-radius: var(--venner-radius);
    font-family: var(--venner-font);
    animation: venner-fade-in var(--venner-transition-fast);
}

@keyframes venner-fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
```

**Zalety**:
- **Design tokens** — `--venner-*` dla spójności
- **Theme injection** — tokens wstrzykiwane z systemu
- **Runtime theming** — zmiana motywu bez rebuild
- **Fallback values** — `var(--venner-radius, 6px)`

---

## 4. State Management

### 4.1. Visage Old — useState + useEffect

```tsx
function Window({ children, position, onLoaded }) {
    const [isVisible, setIsVisible] = useState(false);

    // Brak centralnego store — każdy komponent ma swój stan
    // Trudne do sync między komponentami
}
```

**Problemy**:
- **Rozproszony stan** — każdy komponent ma własny useState
- **Prop drilling** — callbacks przechodzą przez wiele poziomów
- **Brak persistence** — stan ginie przy zamknięciu
- **Brak time-travel** — brak możliwości debugowania

### 4.2. Venner New — Rust Store + Zag.js

```rust
// crates/venner_core/src/store.rs
pub struct VennerStore {
    state: Arc<RwLock<AppState>>,
    history: Vec<(Action, AppState)>,  // Time-travel log
}

impl VennerStore {
    pub fn dispatch(&self, action: Action) {
        let mut state = self.state.write().unwrap();
        self.history.push((action.clone(), state.clone()));
        reduce(&mut state, &action);
        self.broadcast_to_js(&action, &state);
    }
}
```

```typescript
// packages/core/src/store.ts
class VennerStore {
    dispatch(action: Action) {
        invoke("dispatch", { action });
    }

    subscribe(fn: (state: AppState) => void) {
        // Zero-copy channel z Rust
    }
}

export const store = new VennerStore();
```

**Zalety**:
- **Single Source of Truth** — jeden AppState w Rust
- **Persistence** — stan zapisuje się automatycznie
- **Time-travel** — historia akcji do debugowania
- **Cross-window sync** — stan synchronizowany między oknami
- **Type-safe** — typy generowane z Rust (Specta)

---

## 5. Theme System

### 5.1. Visage Old — Brak Theme Systemu

**Brak**:
- Ekstrakcji kolorów z systemu
- CSS variables
- Theme detection
- Multiple themes

### 5.2. Venner New — Full Theme Extraction

```typescript
// packages/themes/gnome/src/loader.ts
export async function loadGnomeTheme() {
    const gtkTheme = process.env.GTK_THEME || "Adwaita";
    const cssPath = `${process.env.HOME}/.themes/${gtkTheme}/gtk-4.0/gtk.css`;
    const css = await Deno.readTextFile(cssPath);
    const colors = parseGnomeColors(css);

    return {
        bg: colors.window_bg || "#353535",
        accent: colors.accent || "#3584e4",
        // ...
    };
}

// packages/themes/gnome/src/inject.ts
export function injectGnomeTokens(config) {
    const css = `
        :root {
            --venner-bg: ${config.colors.bg};
            --venner-accent: ${config.colors.accent};
        }
    `;
    injectTokens(css);  // Wstrzyknięcie do WebView
}
```

**Wynik**:
- Aplikacja **wygląda natywnie** na GNOME (Adwaita, Nord, etc.)
- Aplikacja **wygląda natywnie** na KDE (Breeze, Breath, etc.)
- Automatyczna detekcja **dark/light mode**
- Runtime theme switch bez reload

---

## 6. Multi-Platform Support

### 6.1. Visage Old — Tylko Tauri

```json
{
  "dependencies": {
    "@tauri-apps/api": "^1.0.0"
  }
}
```

**Brak**:
- Detekcji środowiska desktopowego
- Adaptacji pod GNOME/KDE
- Natywnego look & feel

### 6.2. Venner New — Full Platform Abstraction

```typescript
// packages/themes/common/src/detect.ts
export function detectEnvironment(): DesktopEnvironment {
    // Sprawdź GDMSESSION, DESKTOP_SESSION, GTK_THEME
    if (process.env.GDMSESSION?.includes("gnome")) {
        return "gnome";
    }
    if (process.env.GDMSESSION?.includes("kde")) {
        return "kde";
    }
    return "unknown";
}
```

**Adaptery platformowe**:
| Pakiet | Odpowiedzialność |
| :--- | :--- |
| `themes/gnome` | Ekstrakcja z GTK CSS + gsettings |
| `themes/kde` | Ekstrakcja z kdeglobals + kreadconfig5 |
| `adapters/solid` | Komponenty SolidJS |
| `adapters/react` | Komponenty React (opcjonalnie) |

---

## 7. Build System

### 7.1. Visage Old — Babel

```json
{
  "scripts": {
    "build": "babel src --out-dir lib"
  }
}
```

**Problemy**:
- **Brak watch mode** — wolny feedback loop
- **Brak caching** — każdy build od nowa
- **Brak typescript** — tylko JSX
- **Monolityczny build** — wszystko w jednym kroku

### 7.2. Venner New — Turbo + Bun + Cargo

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build", "codegen"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["codegen"]
    }
  }
}
```

**Zalety**:
- **Incremental builds** — tylko zmienione pakiety
- **Parallel execution** — Rust i JS budowane równolegle
- **Code generation** — typy z Rust → TS automatycznie
- **Workspace isolation** — każdy pakiet ma swoje zależności

---

## 8. Ewolucja Learning Points

### 8.1. Co z visage_old warto zachować?

| Element | Co zabrać | Dlaczego |
| :--- | :--- | :--- |
| **KnightRider loader** | Animacja CSS | Elegancki visual effect, możliwy jako `@venner/ui` |
| **Window fade-in** | Animacja CSS | Smooth transitions, możliwy jako `--venner-transition-*` |
| **Page transition** | Koncept | Page transitions w `@venner/primitives` |
| **Tauri integration** | Pattern | `getCurrent()`, `center()` → w `@venner/core` API |

### 8.2. Co trzeba przepisać?

| Element | Nowa implementacja |
| :--- | :--- |
| **Window component** | Zag.js machine + CSS tokens |
| **LoadingBar** | Zag.js progress machine + theme tokens |
| **CSS Modules** | CSS Variables + theme injection |
| **useState** | Rust Store + Zag.js |
| **Hardcoded colors** | `--venner-*` tokens |

### 8.3. Błędy uniknięte w nowej architekturze

```
Visage Old Mistakes → Venner New Solutions
─────────────────────────────────────────
❌ Monolithic src/   → ✅ Monorepo packages/
❌ No state mgmt     → ✅ Rust Store + Zag.js
❌ Hardcoded CSS     → ✅ CSS Variables + Theme Injection
❌ React-only       → ✅ Framework-agnostic primitives
❌ No typesafety    → ✅ Specta code generation
❌ No persistence   → ✅ Auto-save + restore
❌ No platform Abstraction → ✅ GNOME/KDE detection
```

---

## 9. Migration Path

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION STRATEGY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FAZA 1: Foundation (2-3 tygodnie)                                │
│  ├── Setup monorepo (Bun + Cargo)                               │
│  ├── Implement Venner Core (Rust Store)                         │
│  └── Code generation (Specta)                                   │
│                                                                   │
│  FAZA 2: Primitives (2-3 tygodnie)                              │
│  ├── Zag.js machines (Button, Window, Progress)                 │
│  ├── Theme extraction (GNOME + KDE)                             │
│  └── CSS base tokens                                            │
│                                                                   │
│  FAZA 3: Adapters (2 tygodnie)                                  │
│  ├── SolidJS adapter                                            │
│  └── Port visage_old components                                 │
│                                                                   │
│  FAZA 4: Polish (1-2 tygodnie)                                  │
│  ├── Visual regression tests                                    │
│  ├── Performance optimization                                    │
│  └── Documentation                                              │
│                                                                   │
│  RAZEM: ~8-10 tygodni MVP                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Podsumowanie

| Aspekt | Visage Old | Venner New |
| :--- | :--- | :--- |
| **Architektura** | Monolith | Monorepo |
| **Language Mix** | JS only | Rust + TypeScript |
| **State** | useState | Rust Store + Zag.js |
| **Styling** | CSS Modules | CSS Variables + Theme Injection |
| **Platform** | Tauri basic | Multi-platform (GNOME/KDE) |
| **Build** | Babel | Turbo + Bun + Cargo |
| **Testing** | Manual | Visual regression + unit |
| **Persistence** | ❌ | ✅ (Rust Store) |
| **Time-travel** | ❌ | ✅ (History log) |
| **Native feel** | ❌ | ✅ (Theme extraction) |

**Kluczowe różnice**:
1. **Od monolitu do monorepo** — separacja concerns
2. **Od JS do Rust + TS** — wydajność + type safety
3. **Od useState do Zag.js** — framework-agnostic state machines
4. **Od hardcoded CSS do tokens** — native look na każdej platformie
5. **Od prostego Tauri do full platform** — GNOME/KDE detection

**Wniosek**: `visage_old` był wartościowym prototypem do zrozumienia potrzeb. `venner` jest **pełną reimplementacją** z myślą o:
- Skalowalności (monorepo)
- Wydajności (Rust)
- Spójności (design tokens)
- Natywności (theme extraction)
- Elastyczności (framework-agnostic)

---

## Relacje z innymi dokumentami

| Dokument | Relacja |
| :--- | :--- |
| `05_architektura_monorepo.md` | Szczegółowa struktura packages/ |
| `10_architektura_stanu.md` | Rust Store jako ewolucja useState |
| `11_plan_monorepo_wielojęzykowego.md` | Rust + TS workspace setup |
| `12_architektura_button_gnome_kde.md` | Przykład nowej architektury komponentu |
| `PODSUMOWANIE.md` | Streszczenie ewolucji |

