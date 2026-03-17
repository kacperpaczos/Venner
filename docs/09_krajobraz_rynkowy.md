# 09. Krajobraz Rynkowy 2025/2026: Zestawienie i Wnioski

Klasyfikacja dostępnych frameworków desktopowych według architektury i zużycia zasobów.

## Tier 1: Frameworki Webowe (Bundled Runtime)

Używają osadzonego silnika przeglądarki (Chromium) i środowiska Node.js.

| Framework | Pamięć (Min) | Rozmiar (Min) | Silnik | Główna Zaleta | Główna Wada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Electron** | ~120 MB | ~100 MB | Chromium + V8 | Ekosystem NPM. | Bardzo wysokie zużycie pamięci. |
| **NW.js** | ~100 MB | ~120 MB | Chromium + Node | Dostęp do Node w DOM. | Martwy ekosystem. |

**Wniosek**: Electron dławi system operacyjny przy wielu otwartych aplikacjach.
**Decyzja w Projekcie**: Odrzucamy Electrona. Nasza aplikacja ma być działającym w tle "obywatelem drugiej kategorii", który nie rywalizuje o RAM z głównymi narzędziami użytkownika (np. IDE, Przeglądarka).

## Tier 2: Frameworki Natywnego Rysowania (Painted UI)

Używają własnego silnika graficznego do rysowania pikseli, pomijając kontrolki systemowe.

| Framework | Pamięć (Min) | Rozmiar (Min) | Silnik | Główna Zaleta | Główna Wada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Flutter** | ~60 MB | ~20 MB | Skia Impeller (C++) | Identzyczny wygląd wszędzie. | Problemy z dostępnością (A11y). |
| **Avalonia** | ~50 MB | ~40 MB | Skia (.NET) | Silne typowanie C#. | Zależność od .NET Runtime. |

**Wniosek**: Problemy z dostępnością (A11y) we Flutterze są ryzykiem prawnym (European Accessibility Act).
**Decyzja w Projekcie**: Odrzucamy Fluttera. Musimy polegać na natywnym drzewie dostępności HTML, które jest rozwijane przez dostawców przeglądarek od 20 lat.

## Tier 3: Hybrydy Systemowe (OS WebView)

Używają silnika przeglądarki dostarczanego przez system operacyjny.

| Framework | Pamięć (Min) | Rozmiar (Min) | Silnik | Główna Zaleta | Główna Wada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tauri v2** | **~30 MB** | **~4 MB** | WebView2 / WebKit | Rozmiar, Bezpieczeństwo. | Fragmentacja silników JS. |
| **Wails** | ~30 MB | ~6 MB | WebView2 / WebKit | Prostszy język (Go). | Mniejszy ekosystem pluginów. |

**Wniosek**: Tier 3 to jedyna kategoria, która pozwala na stworzenie nowoczesnej aplikacji (<5MB) bez "wzdęcia".
**Rozwiązanie w Frameworku**: Wybór **Tauri** (nad Wails) ze względu na Rust, który gwarantuje memory-safety w warstwie backendowej, co jest krytyczne przy bezpośredniej operacji na plikach systemowych.

## Podsumowanie Strategiczne

Dla projektu **Next-Gen Desktop Framework** wybrano **Tauri (Tier 3)**.

**Uzasadnienie Biznesowe**:
1.  **AI Readiness**: Zaooszczędzone ~200MB RAM (względem Electrona) pozwala na załadowanie małego modelu językowego (SLM) bezpośrednio w procesie aplikacji.
2.  **Konwersja**: Instalator 4MB pobiera się w 2 sekundy. Instalator 120MB (Electron) w 30 sekund.
3.  **Dostępność**: Pełne wsparcie dla czytników ekranowych "z pudełka".
