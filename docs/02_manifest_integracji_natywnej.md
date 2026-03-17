# 02. Integracja Natywna: Specyfikacja i Implementacja

Definicja technicznych wymogów integracji z systemem operacyjnym (Windows/macOS/Linux) oraz sposoby ich realizacji w kodzie.

## 1. Synchronizacja Stanu Okien

**Wymaganie**: Aplikacja musi przywracać dokładną pozycję, rozmiar i stan maksymalizacji po restarcie, aby uniknąć frustracji użytkownika.
**Analiza**: Ręczne zapisywanie do `localStorage` powoduje problemy z wyścigami przy wielu oknach i opóźnienia "FOUC".

**Wniosek**: Stan okna musi być zarządzany przez proces główny (Rust), a nie renderera.
**Rozwiązanie w Frameworku**:
*   Integracja `tauri-plugin-window-state`.
*   Konfiguracja w `main.rs`: `Builder::default().plugin(tauri_plugin_window_state::Builder::default().build())`.
*   Zablokowanie widoczności okna (`visible: false` w `tauri.conf.json`) do momentu, aż plugin nie przywróci pozycji.

## 2. Menu Systemowe

**Wymaganie macOS**: Obecność `Global Menu Bar` (Plik, Edycja, Widok). Aplikacje bez tego są odrzucane przez użytkowników Mac jako "nieprofesjonalne".
**Wymaganie Windows 11**: Obsługa **Snap Layouts** (dymek przycisku maksymalizacji).

**Wniosek**: Niestandardowe paski tytułu HTML/CSS często psują natywne funkcje OS (Snap Assist).
**Rozwiązanie w Frameworku**:
*   Na macOS: Użycie wyłącznie `tauri::menu::Menu` (natywne API Cocoa).
*   Na Windows: Użycie **Window Controls Overlay** (WCO). Pozwala to na wstrzyknięcie HTML *obok* natywnych przycisków sterujących, zachowując funkcjonalność Snap Layouts.

## 3. Protokół Deep Linking

**Cel**: Obsługa otwierania aplikacji z linków `visage://resource/id`.
**Problem**: Kliknięcie linku zazwyczaj uruchamia *nowy* proces aplikacji, zamiast skupić *istniejący*.

**Wniosek**: Konieczna jest logika Single Instance Lock.
**Rozwiązanie w Frameworku**:
*   Użycie `tauri-plugin-single-instance`.
*   W callbacku pluginu:
    1.  Odbierz argumenty CLI z drugiej instancji.
    2.  Znajdź główne okno (`app_handle.get_window("main")`).
    3.  Wymuś fokus (`window.set_focus()`).
    4.  Wyemituj event `navigate` z URL-em do Routera JS.

## 4. Dostępność Komponentów (WAI-ARIA)

**Wymaganie**: Wszelkie niestandardowe kontrolki (Custom Controls) muszą implementować wzorce ARIA.
**Analiza**: Implementacja wzorca "Combobox" wymaga obsługi 12 różnych interakcji klawiatury i 6 atrybutów ARIA.

**Wniosek**: Ręczna implementacja jest zbyt ryzykowna i czasochłonna.
**Rozwiązanie w Frameworku**:
*   Adopcja biblioteki **Ark UI** (SolidJS wrapper dla Zag.js).
*   Komponenty `packages/ui` są jedynie "skórką" (View) dla maszyn stanów Zag (Logic), które mają certyfikowaną zgodność z WAI-ARIA.
