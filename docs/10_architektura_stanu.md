# 10. Architektura Stanu: Venner State Store

Venner implementuje **własny state store w Rust**, inspirowany wzorcem Redux (dispatch → reducer → nowy stan → notify). **Nie używamy biblioteki Redux** — cała logika (reducer, persistence, time-travel) żyje w Rust. JS ma tylko cienką projekcję.

Jeden serializowalny obiekt `AppState` jest właścicielem całego stanu aplikacji. Wstrzyknięcie tego obiektu przy starcie **odtwarza aplikację w dokładnie takim stanie**, w jakim była.

---

## Aktualizacja Implementacyjna (2026-02-12)

Poniższy dokument zawiera część historyczno-koncepcyjną. Ten blok opisuje **stan faktycznie wdrożony** w repo.

### 1. Aktualny kontrakt SSoT

- Rust Store jest SSoT dla modelu aplikacji i kontekstu UI.
- Snapshot eksportowany/importowany jest jako:
  - `schemaVersion`
  - `exportedAt`
  - `appVersion`
  - `state` (`AppState`)
- Import działa jako **hard replace + rehydrate event flow**.

### 2. Aktualny `AppState` (wdrożony)

Najważniejsze pola:

- `schemaVersion`
- `session`: `currentWindowId`, `activeRoute`, `workflowStage`, `uiScale`
- `windows[*]`: `route`, `focused`, `maximized`, `x/y/width/height`, `scroll`, `viewport`
- `widgets[*]`: `persistent`, `transient`, `disabled`, `updatedAt`, `source`
- `ui`: `tabs`, `focus`, `panels`, `lastUpdatedAt`
- `theme`

Źródło implementacji:
- `Venner/crates/venner_core/src/state/app_state.rs`

### 3. Aktualne IPC komendy stanu

Wdrożone komendy:

- `dispatch`
- `get_state`
- `inject_state`
- `get_schema_version`
- `export_state`
- `validate_state`
- `import_state`

Źródło implementacji:
- `Venner/crates/venner_core/src/ipc/commands.rs`

### 4. Rehydrate flow (wdrożony)

Import snapshotu emituje:

1. `rehydrate:started`
2. `state:changed`
3. `rehydrate:completed`

Frontend (`apps/dev`) odtwarza po imporcie:

- route/session scale
- tab selection
- scroll
- focus/caret (best effort z retry)

Źródło implementacji:
- `Venner/crates/venner_core/src/state/store.rs`
- `Venner/apps/dev/src/App.tsx`

### 5. Migracje schematu

- `schemaVersion` jest obowiązkowy (lub domyślnie traktowany jako v1).
- Aktualny target: `CURRENT_SCHEMA_VERSION` (obecnie v2).
- Wdrożony migrator: `v1 -> v2`.

Źródło implementacji:
- `Venner/crates/venner_core/src/state/store.rs` (`migrate_state_value`, `migrate_v1_to_v2`)

### 6. Uwaga o przykładach niżej

Przykłady w dalszej części dokumentu pokazują wzorzec architektoniczny i miejscami używają starszego, uproszczonego API (`snapshot/restore`).
Za źródło prawdy należy przyjmować aktualne pliki kodu wskazane powyżej.

---

## 1. Zasada Fundamentalna

```text
         AppState (Rust)
              │
     ┌────────┴────────┐
     │   Serialize      │   ← JSON / FlatBuffers / BSON
     ▼                  ▼
  snapshot.json    Inject at boot
     │                  │
     └──── Restore ─────┘
              │
     App starts in EXACT same state
```

**Kontrakt**: Jeśli mam `AppState`, mogę:
1. **Zapisać** go do pliku.
2. **Załadować** go przy starcie — app wygląda identycznie.
3. **Wstrzyknąć** dowolny state w testach — app renderuje ten stan od razu.
4. **Przeglądać historię** — time-travel debugging.

To jest jak Redux, ale **store żyje w Rust**, nie w JS.

---

## 2. Rust State Store — Definicja

```rust
// src-tauri/src/store.rs

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

/// Cały stan aplikacji — jedno źródło prawdy.
/// Serializowalny. Wstrzykiwalny. Deterministyczny.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppState {
    /// Wersja schematu (migracje przy upgrade)
    pub version: u32,

    /// Stan każdego okna
    pub windows: HashMap<String, WindowState>,

    /// Stan każdego widgetu (model, nie UI)
    pub widgets: HashMap<String, WidgetState>,

    /// Aktywny motyw systemu (wyekstrahowane tokeny)
    pub theme: ThemeTokens,

    /// Stan nawigacji / routingu
    pub navigation: NavigationState,

    /// Konfiguracja użytkownika
    pub preferences: UserPreferences,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WindowState {
    pub id: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
    pub focused: bool,
    pub route: String,       // np. "/files/home/documents"
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WidgetState {
    pub id: String,
    pub kind: String,        // "switch", "listview", "input", ...
    pub props: serde_json::Value, // Elastyczny — różne widgety mają różne pola
}

// Przykład: Switch widget state
// { "id": "dark-mode-toggle", "kind": "switch", "props": { "checked": true } }
// Przykład: ListView widget state
// { "id": "file-list", "kind": "listview", "props": { "selected": [0, 3], "scroll_top": 240 } }
```

---

## 3. Actions & Reducers (Redux Pattern)

### 3.1. Actions

```rust
/// Każda zmiana stanu przechodzi przez Action — jak w Redux.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Action {
    // Widget actions
    WidgetUpdate { widget_id: String, field: String, value: serde_json::Value },

    // Window actions
    WindowResize { window_id: String, width: u32, height: u32 },
    WindowMove { window_id: String, x: i32, y: i32 },
    WindowFocus { window_id: String },
    WindowClose { window_id: String },

    // Navigation
    Navigate { window_id: String, route: String },

    // Theme
    ThemeChanged { tokens: ThemeTokens },

    // Preferences
    PreferenceSet { key: String, value: serde_json::Value },

    // Batch (wiele actions atomowo)
    Batch(Vec<Action>),
}
```

### 3.2. Reducer

```rust
/// Czysty reducer: (state, action) → new_state
/// Deterministyczny. Testowany bez UI. Bez side-effects.
pub fn reduce(state: &mut AppState, action: &Action) {
    match action {
        Action::WidgetUpdate { widget_id, field, value } => {
            if let Some(widget) = state.widgets.get_mut(widget_id) {
                widget.props[field] = value.clone();
            }
        }
        Action::WindowResize { window_id, width, height } => {
            if let Some(window) = state.windows.get_mut(window_id) {
                window.width = *width;
                window.height = *height;
            }
        }
        Action::Navigate { window_id, route } => {
            if let Some(window) = state.windows.get_mut(window_id) {
                window.route = route.clone();
            }
        }
        Action::Batch(actions) => {
            for a in actions { reduce(state, a); }
        }
        // ... reszta
    }
}
```

### 3.3. Store (Dispatcher + Persistence)

```rust
pub struct VennerStore {
    state: Arc<RwLock<AppState>>,
    history: Vec<(Action, AppState)>,  // Time-travel log
    app_handle: tauri::AppHandle,
}

impl VennerStore {
    /// Dispatch action — jak Redux dispatch()
    pub fn dispatch(&self, action: Action) {
        let mut state = self.state.write().unwrap();

        // Time-travel: zapisz stan sprzed akcji
        self.history.push((action.clone(), state.clone()));

        // Reducer
        reduce(&mut state, &action);

        // Broadcast delta do JS (zero-copy channel)
        self.broadcast_to_js(&action, &state);

        // Persist (debounced, async)
        self.schedule_persist(&state);
    }

    /// Wstrzyknij cały stan — app odtwarza się w tym stanie
    pub fn inject(&self, new_state: AppState) {
        let mut state = self.state.write().unwrap();
        *state = new_state;
        self.broadcast_full_state(&state);
    }

    /// Snapshot — serializacja całego stanu
    pub fn snapshot(&self) -> String {
        let state = self.state.read().unwrap();
        serde_json::to_string_pretty(&*state).unwrap()
    }

    /// Restore ze snapshotu
    pub fn restore(&self, json: &str) {
        let new_state: AppState = serde_json::from_str(json).unwrap();
        self.inject(new_state);
    }
}
```

---

## 4. Tauri Commands (API)

```rust
#[tauri::command]
fn dispatch(store: tauri::State<VennerStore>, action: Action) {
    store.dispatch(action);
}

#[tauri::command]
fn get_state(store: tauri::State<VennerStore>) -> AppState {
    store.state.read().unwrap().clone()
}

#[tauri::command]
fn inject_state(store: tauri::State<VennerStore>, state: AppState) {
    store.inject(state);
}

#[tauri::command]
fn snapshot(store: tauri::State<VennerStore>) -> String {
    store.snapshot()
}

#[tauri::command]
fn restore(store: tauri::State<VennerStore>, json: String) {
    store.restore(&json);
}
```

---

## 5. JS — State Projection + Dispatch

```typescript
// @venner/core/store.ts

import { invoke, Channel } from "@tauri-apps/api/core";

class VennerStore {
    /** Lokalna projekcja stanu (read-only cache) */
    private state: AppState;
    private subscribers = new Set<(state: AppState) => void>();

    async init() {
        // 1. Pobierz pełny stan z Rust przy starcie
        this.state = await invoke<AppState>("get_state");

        // 2. Subscribe na delty (zero-copy channel)
        const channel = new Channel<Uint8Array>();
        channel.onmessage = (raw) => {
            const patch = decode(raw);
            this.applyPatch(patch);
            this.notify();
        };
        await invoke("subscribe_state", { channel });
    }

    /** Dispatch action do Rust — jedyny sposób na zmianę stanu */
    dispatch(action: Action) {
        invoke("dispatch", { action });
    }

    /** Subscribe na zmiany stanu (jak Redux subscribe) */
    subscribe(fn: (state: AppState) => void) {
        this.subscribers.add(fn);
        return () => this.subscribers.delete(fn);
    }

    /** Selector (jak Redux useSelector) */
    select<T>(selector: (state: AppState) => T): T {
        return selector(this.state);
    }

    /** Snapshot do JSON — do zapisania/wysłania */
    async snapshot(): Promise<string> {
        return invoke<string>("snapshot");
    }

    /** Inject state — app odtwarza się w tym stanie */
    async inject(state: AppState) {
        await invoke("inject_state", { state });
    }
}

export const store = new VennerStore();
```

### Użycie w SolidJS Adapter

```tsx
// @venner/solid/Switch.tsx
import { store } from "@venner/core";
import { createSignal, onMount } from "solid-js";

export function Switch(props: { widgetId: string }) {
    const [checked, setChecked] = createSignal(false);

    onMount(() => {
        // Init z Rust state
        setChecked(store.select(s => s.widgets[props.widgetId]?.props.checked ?? false));

        // Subscribe na zmiany z Rust
        store.subscribe((s) => {
            setChecked(s.widgets[props.widgetId]?.props.checked ?? false);
        });
    });

    const toggle = () => {
        // Optimistic UI
        setChecked(!checked());
        // Dispatch do Rust (source of truth)
        store.dispatch({
            type: "WidgetUpdate",
            widget_id: props.widgetId,
            field: "checked",
            value: !checked()
        });
    };

    return <button class="venner-switch" data-checked={checked()} onClick={toggle} />;
}
```

---

## 6. Snapshot & Inject — Przypadki Użycia

### 6.1. Testowanie

```typescript
// test/switch.test.ts
import { store } from "@venner/core";

test("switch reflects injected state", async () => {
    // Wstrzyknij stan testowy — app odpala się z checked=true
    await store.inject({
        version: 1,
        windows: { main: { id: "main", route: "/settings", ... } },
        widgets: {
            "dark-mode": { id: "dark-mode", kind: "switch", props: { checked: true } }
        },
        ...
    });

    // Assert: switch jest zaznaczony
    expect(screen.getByRole("switch")).toHaveAttribute("data-checked", "true");
});
```

### 6.2. Crash Recovery

```rust
// src-tauri/main.rs
fn main() {
    std::panic::set_hook(Box::new(|info| {
        // Zapisz snapshot przed crashem
        if let Ok(store) = STORE.read() {
            let snapshot = store.snapshot();
            std::fs::write(crash_state_path(), snapshot).ok();
        }
    }));

    // Przy starcie: sprawdź czy jest crash state
    let initial_state = if crash_state_path().exists() {
        let json = std::fs::read_to_string(crash_state_path()).unwrap();
        std::fs::remove_file(crash_state_path()).ok(); // one-shot
        serde_json::from_str(&json).unwrap()
    } else if saved_state_path().exists() {
        // Normal restore z ostatniej sesji
        let json = std::fs::read_to_string(saved_state_path()).unwrap();
        serde_json::from_str(&json).unwrap()
    } else {
        AppState::default() // Fresh start
    };

    let store = VennerStore::new(initial_state);
}
```

### 6.3. Time-Travel Debugging

```rust
impl VennerStore {
    /// Cofnij do N-tej akcji (jak Redux DevTools)
    pub fn time_travel(&self, step: usize) {
        if step < self.history.len() {
            let (_, past_state) = &self.history[step];
            self.inject(past_state.clone());
        }
    }

    /// Replay — odtwórz sekwencję akcji od initial state
    pub fn replay(&self, actions: Vec<Action>) {
        let mut state = AppState::default();
        for action in &actions {
            reduce(&mut state, action);
        }
        self.inject(state);
    }
}
```

### 6.4. Synchronizacja między oknami

```text
User opens second window
       │
       ▼
  Rust creates new WindowState in AppState
       │
       ├─→ Broadcasts full state to new window → JS hydrates
       └─→ Broadcasts delta to existing windows → "new window" tab appears
```

---

## 7. Wydajność

| Operacja | Budget | Mechanizm |
|:---|:---|:---|
| `dispatch()` → reducer | < 0.1ms | Pure Rust, no I/O |
| Broadcast delta to JS | < 0.5ms | Zero-copy Channel |
| Full state serialize (snapshot) | < 5ms (100 widgets) | `serde_json` (snapshot only) |
| State restore (inject) | < 2ms | Deserialize + broadcast |
| Persist to disk | Debounced 500ms | Async `tokio::fs::write` |

**Optymalizacja**: Delty (zmiany) lecą przez FlatBuffers (zero-copy). Pełna serializacja (snapshot/restore) używa JSON — wolniejsza, ale czytelna i rzadka (boot/crash).

---

## 8. Zag.js — Rola w Redux Pattern

Zag.js **nadal zarządza stanami UI** (hover, focus, animacja), ale **model state** pochodzi z Rust Store:

```text
┌──────────────────────────────────────┐
│           Rust State Store           │  ← Redux-like SOT
│  AppState { widgets, windows, ... }  │
│  dispatch(Action) → reduce → notify │
└──────────────┬───────────────────────┘
               │ zero-copy delta
┌──────────────┴───────────────────────┐
│         JS State Projection          │  ← Read-only cache
│  store.select(s => s.widgets[id])    │
└──────────────┬───────────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
  Zag.js              Framework
  (local UI          Adapter
   hover,            (Solid/React)
   focus,
   anim)             Reads projection
                     + Zag.js local
```

**Zag.js nie jest zastąpiony** — jest "kontrolerem UI" (hover, focus ring, keyboard nav, WAI-ARIA).
**Rust Store** jest "kontrolerem modelu" (checked, selected, value, route).
Razem: **jeden spójny widok** aplikacji.

---

## 9. Lekcje z redux-rs

Analiza biblioteki [redux-rs](https://github.com/redux-rs/redux-rs) dostarcza cennych wzorców, które zaadoptujemy w Vennerze, unikając jednocześnie jej problemów (przestarzały model asynchroniczny).

### 9.1. Abstrakcja przez Traity
Zamiast twardego definiowania reducera jako funkcji, użyjemy traitów dla maksymalnej modułowości:

```rust
pub trait Reducer<S, A> {
    fn reduce(&self, state: &mut S, action: &A);
}

pub trait Middleware<S, A> {
    fn on_action(&self, store: &VennerStore, action: &A, next: &dyn Fn(&A));
}
```
*Zaleta*: Pozwala na łatwe dodawanie pluginów (np. logger, analytics, crash-reporter) bez modyfikacji rdzenia store'a.

### 9.2. Wzorzec Middleware (Side Effects)
`redux-rs` pokazuje, jak elegancko oddzielić czysty stan od I/O:
- **Reducer**: Tylko `(state, action) -> state` (synchronous, no I/O).
- **Middleware**: Tu dzieje się magia (zapis na dysk, zapytania sieciowe, logowanie).

### 9.3. Efektywne Selektory
Wzorzec `Selector` z `redux-rs` pozwala na zapobieganie niepotrzebnym powiadomieniom w JS:
- Jeśli `AppState` ma 10MB, ale zmieniliśmy tylko `checked` w jednym switchu, selektor po stronie Rust może stwierdzić: "Nic innego się nie zmieniło, wyślij tylko minimalną deltę".

---

## 10. Podsumowanie

| Cecha | Jak w Redux | Jak w Venner |
|:---|:---|:---|
| Single state tree | `createStore(reducer)` | `VennerStore::new(AppState)` |
| Actions | `dispatch({ type: "TOGGLE" })` | `store.dispatch(Action::WidgetUpdate { ... })` |
| Reducer | `(state, action) => newState` | `fn reduce(state: &mut AppState, action: &Action)` |
| Subscribe | `store.subscribe(listener)` | `store.subscribe(fn)` + zero-copy channel |
| Snapshot | Redux DevTools export | `store.snapshot()` → JSON |
| Inject/Restore | Redux DevTools import | `store.inject(state)` → app odtwarza się |
| Time-travel | Redux DevTools slider | `store.time_travel(step)` |
| Persistence | `redux-persist` | Debounced `tokio::fs::write` |
| **Różnica** | Store w JS (single thread) | **Store w Rust** (multi-thread safe, `Arc<RwLock>`) |
