# 04. Analiza Wąskich Gardeł: Specyfikacja i Rozwiązania

Dokument identyfikuje techniczne ograniczenia architektury Tauri v2 oraz wymagane metody mitygacji zaszyte w frameworku.

## 1. Narzut Serializacji IPC (JSON Overhead)

**Problem**: Komunikacja JS <-> Rust używa `serde_json` (domyślnie).
**Mechanizm**: `Stringify (JS)` -> `Pipe` -> `Deserialize (Rust)` -> `Serialize (Rust)` -> `Pipe` -> `Parse (JS)`.

### Dane Wydajnościowe (Windows 11, Ryzen 7 5800X)

| Payload Size | Metoda | Czas (Avg) | Wpływ na UI |
| :--- | :--- | :--- | :--- |
| **10 KB** | `invoke` (JSON) | ~0.5 ms | Pomijalny |
| **10 MB** | `invoke` (JSON) | **~180-250 ms** | Zauważalne zcięcie UI (Jank) |
| **10 MB** | `tauri::ipc::Response` (Binary) | **~5-8 ms** | Płynne |

**Wniosek**: JSON nie nadaje się do przesyłania blobów i plików.
**Rozwiązanie w Frameworku**:
1.  **Backend**: Implementacja traitu `Into<tauri::ipc::Response>` dla struktur zawierających bufory `Vec<u8>`.
2.  **Frontend**: Wrapper `@venner/core` — `ipcClient.requestBinary()`, który parsuje odpowiedź jako `ArrayBuffer` zamiast `JSON`.

## 2. Dystrybucja WebView2 (Windows)

**Zależność**: Aplikacja wymaga biblioteki `WebView2Loader.dll` oraz zainstalowanego "Evergreen WebView2 Runtime".
**Ryzyko**: Na systemach Windows Server i LTSC runtime może nie być obecny.

**Wniosek**: Nie można polegać na obecności systemowego WebView na Windows.
**Rozwiązanie w Frameworku**:
*   Skonfigurowanie **WiX Toolset v4** w potoku CI/CD.
*   Dodanie akcji "Bootstrapper", która przy instalacji sprawdza rejestr: `HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{...}`.
*   Jeśli klucz nie istnieje -> Pobierz i zainstaluj Runtime w trybie cichym.

## 3. Pułapka Fokusu (WebView vs Native Windows)

**Opis**: Otwarcie natywnego dialogu (np. `file dialog`) nie zawsze zwraca fokus do WebView.
**Ryzyko**: Użytkownik traci możliwość obsługi aplikacji klawiaturą.

**Wniosek**: Tauri gubi kontekst fokusu przy przełączaniu okien Win32.
**Rozwiązanie w Frameworku**:
*   Globalny `InteractionManager` w `@venner/primitives`, który nasłuchuje na `tauri://blur` i `tauri://focus`.
*   Przy zamknięciu dialogu, kod Rusta wymusza `window.set_focus()` na poziomie API OS.

## 4. Błędy Paniki Rust (Panic Handling)

**Działanie**: `panic!` w wątku głównym Rust powoduje natychmiastowe zamknięcie procesu (crash to desktop).

**Wniosek**: Brak obsługi błędów krytycznych sprawia wrażenie niestabilności.
**Rozwiązanie w Frameworku**:
*   Zastosowanie hooka `std::panic::set_hook` w `src-tauri/main.rs`.
*   W przypadku paniki:
    1.  Zrzut stosu do pliku `%APPDATA%/Venner/crash.log`.
    2.  Wyświetlenie natywnego `MessageDialog` z informacją o błędzie.
    3.  Graceful shutdown (zamknięcie połączeń DB).

## 5. Wydajność Widgetów (Performance Budget)

**Problem**: Framework-agnostic maszyny stanów dodają warstwę abstrakcji. To musi być kontrolowane.

**Wniosek**: Wydajność jest fundamentem — każda warstwa abstrakcji musi mieć mierzalny narzut < 1ms na widget.
**Rozwiązanie w Frameworku**:
*   **Performance Budget**: Inicjalizacja 100 widgetów < 16ms (jeden frame).
*   **Benchmark Suite**: Automatyczne porównanie Venner widgets vs vanilla DOM.
*   **Lazy Machine Init**: Maszyny stanów Zag.js inicjalizowane dopiero przy interaction, nie przy mount.
