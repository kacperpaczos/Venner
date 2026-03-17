# 01. Analiza Porównawcza: Metryki i Dane Techniczne

Ten dokument zestawia twarde dane wydajnościowe i architektoniczne dla wiodących frameworków desktopowych (Stan na Q1 2026).

## 1. Zużycie Zasobów (Benchmarks)

Dane dla aplikacji typu "Hello World" oraz "Real World App" (Slack-like).

| Metryka | Tauri v2 (WebView) | Electron (Chromium) | Flutter (Skia) | Źródło / Uwagi |
| :--- | :--- | :--- | :--- | :--- |
| **Instalator (Windows .msi)** | **~4.5 MB** | ~120 MB | ~20 MB | Electron bundluje Node.js + Chromium. Tauri linkuje dynamicznie WebView2. |
| **RAM (Idle - Hello World)** | **~35 MB** | ~130 MB | ~55 MB | *Levminer Benchmark 2024*. |
| **RAM (Real World - 50k linii)** | **~80 MB** | ~450 MB | ~110 MB | Electron tworzy osobny proces renderera per okno. |
| **Czas Startu (Cold Boot)** | **~0.4s** | ~1.5s | ~0.8s | Tauri nie inicjalizuje pełnego środowiska JS przy starcie. |

**Wniosek**: Tauri redukuje narzut pamięci RAM o ~82% względem Electrona, co jest kluczowe dla aplikacji działających w tle.
**Rozwiązanie w Frameworku**:
*   Implementacja **Tray-Only Mode** przy starcie (ukryte okno), co przy 35MB RAM jest niezauważalne dla użytkownika.
*   Użycie kompresji binarki `upx` w CI/CD, aby utrzymać rozmiar instalatora < 5MB.

## 2. Wydajność Renderowania i UI (js-framework-benchmark)

Porównanie silników renderujących przy operacjach na DOM (1000 wierszy).

| Operacja | SolidJS (Ref. Impl.) | React 18 | Vue 3 | Analiza |
| :--- | :--- | :--- | :--- | :--- |
| **Tworzenie Wierszy** | **28.4 ms** | 92.1 ms | 38.2 ms | SolidJS kompiluje do bezpośrednich operacji DOM. |
| **Swap Rows** | **22.1 ms** | 60.5 ms | 30.1 ms | React wykonuje diff całego VDOM. |
| **Pamięć po operacjach** | **5 MB** | 16 MB | 7 MB | SolidJS nie alokuje struktur VDOM. |

**Wniosek**: Wydajność renderowania jest fundamentalna. Framework musi być **agnostyczny** — SolidJS jako referencyjna implementacja, ale adaptery dla React/Vue/Svelte muszą być możliwe.
**Rozwiązanie w Frameworku**:
*   **Agnostyczna warstwa logiki** (`@venner/primitives`) — maszyny stanów Zag.js, zero zależności od frameworka UI.
*   **Adaptery per framework**: `@venner/solid` (referencyjny), przyszłe `@venner/react`, `@venner/vue`.
*   Wymuszenie wirtualizacji (`@tanstack/virtual`) dla list > 50 elementów.

## 3. Architektura IPC (Inter-Process Communication)

| Cecha | Tauri v2 | Electron | Flutter |
| :--- | :--- | :--- | :--- |
| **Transport** | JSON over Named Pipes / Unix Sockets | JSON over IPC Pipes | Binary BinaryMessenger |
| **Latencja (małe wiadomości)** | ~0.5ms | ~0.5ms | ~0.2ms |
| **Latencja (10MB blob, Win11)** | **~200ms** (JSON serialization bottleneck) | ~50ms (Buffer passing) | ~15ms (Zero-copy) |
| **Bezpieczeństwo** | **Isolation Pattern**. Frontend nie ma dostępu do Node API. | `contextIsolation` (wymaga konfiguracji). | Kod natywny kompilowany razem z UI. |

**Wniosek**: Domyślna komunikacja w Tauri (JSON) jest nieakceptowalna dla transferu plików i mediów.
**Rozwiązanie w Frameworku**:
*   Abstrakcja warstwy IPC w `@venner/core` automatycznie wybierająca kanał:
    *   Dla poleceń (JSON): `invoke()`.
    *   Dla danych (Binary): `tauri::ipc::Response` (Zero-Copy).
*   Zakaz przesyłania obrazów jako Base64 Strings (wymuszony przez linter).

## 4. Różnice w Dostępności (Accessibility - A11y)

| Framework | Mechanizm A11y | Zgodność z Czytnikami (JAWS/NVDA) |
| :--- | :--- | :--- |
| **Tauri (HTML)** | **Natywne Drzewo DOM**. Przeglądarka mapuje HTML API na OS API. | **100%**. Automatyczna obsługa ról, stanów i zdarzeń. |
| **Flutter** | **Drzewo Semantyczne**. Rysuje piksele, "udaje" kontrolki dla OS. | **~80%**. Problemy z nawigacją karetką, zaznaczaniem tekstu i niestandardowymi kontrolkami. |

**Wniosek**: Flutter nie spełnia w 100% wymogów European Accessibility Act dla aplikacji publicznych.
**Rozwiązanie w Frameworku**:
*   Użycie **Zag.js** w `@venner/primitives`, który ma wbudowane maszyny stanów zgodne ze specyfikacją WAI-ARIA.
*   Logika A11y jest framework-agnostic — działa identycznie niezależnie od wybranego adaptera (SolidJS/React/Vue).

## 5. Runtime i Tooling

| Metryka | Bun | Node.js | Deno |
| :--- | :--- | :--- | :--- |
| **Install (1000 deps)** | **~2s** | ~15s | ~8s |
| **Bundle Size** | Wbudowany bundler | Wymaga Webpack/Vite | Wbudowany |
| **TS Support** | Natywny | Wymaga tsc/tsx | Natywny |
| **Kompatybilność NPM** | ~98% | 100% | ~90% |

**Wniosek**: Bun oferuje najlepszą wydajność toolingu przy zachowaniu kompatybilności z ekosystemem NPM.
**Rozwiązanie w Frameworku**: Bun jako domyślny runtime i package manager. Turborepo jako build orchestrator.

## 6. Podsumowanie Końcowe

Tauri v2 + framework-agnostic primitives (Zag.js) + Bun to stos, który zapewnia **wydajność** (kluczowa), **bezpieczeństwo typów** (Rust/TS), **minimalne zużycie zasobów** i **pełną dostępność**.
Framework NIE jest przywiązany do jednego frameworka UI — SolidJS jest referencyjną implementacją ze względu na najlepszą wydajność, ale architektura pozwala na adaptery dla dowolnego frameworka.
