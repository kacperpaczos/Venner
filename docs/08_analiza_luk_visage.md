# 08. Analiza Luk Visage: Audyt Techniczny

Porównanie obecnej bazy kodu (Visage v0.0.1) ze specyfikacją Venner.

## 1. Zestawienie Architektoniczne

| Obszar | Implementacja Obecna (Visage) | Wymagana Implementacja (Venner) | Status |
| :--- | :--- | :--- | :--- |
| **Framework UI** | React 18 (VDOM) | Framework-agnostic. SolidJS adapter referencyjny. | **Niezgodny** |
| **Zarządzanie Stanem** | `useState` / `useEffect` | Zag.js State Machines (`@venner/primitives`) | **Niezgodny** |
| **Testowalność** | Brak separacji (UI sprzęgnięte z Tauri) | Logika odseparowana w `@venner/primitives` (zero frameworka) | **Niezgodny** |
| **Runtime** | Node.js + Babel | **Bun** + TypeScript (natywny) | **Niezgodny** |
| **Stylowanie** | Hardcoded CSS | Zmienne `--venner-*` z ekstrakcji motywu systemu | **Niezgodny** |

**Wniosek**: Visage reprezentuje dług technologiczny, którego nie da się refaktoryzować przyrostowo.
**Rozwiązanie w Frameworku**:
*   Inicjalizacja **Czystego Monorepo** w repozytorium Venner.
*   Portowanie wyłącznie koncepcji wizualnych (pomysły na layout, animacje).
*   Porzucenie kodu Reacta i Babela.

## 2. Krytyczne Błędy Implementacyjne (Code Audit)

### 2.1. Sprzężenie (Coupling)

**Problem**: Komponenty importują `@tauri-apps/api` bezpośrednio.
**Wniosek**: Uniemożliwia to testowanie poza kontekstem Tauri.
**Rozwiązanie w Frameworku**:
*   Wzorzec **Adaptera** w `@venner/core`.
*   Frontend korzysta z interfejsu `IPlatform`, który ma implementacje:
    1.  `TauriPlatform` (produkcja).
    2.  `MockPlatform` (testy/browser development).
    3.  Potencjalnie `ElectronPlatform` (przyszłość).

### 2.2. Zarządzanie Efektami Ubocznymi

**Problem**: Użycie `setTimeout` wewnątrz `useEffect` do synchronizacji animacji.
**Wniosek**: Niedeterministyczne zachowanie UI.
**Rozwiązanie w Frameworku**:
*   Maszyny stanów Zag.js w `@venner/primitives`. Maszyna czeka na sygnał końca animacji (`transitionend`), zamiast zgadywać czas.

### 2.3. Logika (Machine Pattern)

**Problem (Visage)**: Imperatywne zarządzanie stanem w `useEffect`.
**Rozwiązanie (Venner)**:
```typescript
// @venner/primitives/window.machine.ts — ZERO framework dependencies
const windowMachine = createMachine({
    states: {
        hidden: { on: { OPEN: 'opening' } },
        opening: {
            after: { 300: 'visible' }
        },
        visible: { entry: ['notifyLoaded'] }
    }
})
```
*   **Logika determinuje Widok**: Maszyna dyktuje stan. Adapter (SolidJS/React) reaguje.
*   **Testowalność**: Maszyna testowalna w Bun bez renderowania piksela.

## 3. Rekomendacja Strategiczna

**Nie "refaktoryzuj" Visage. Zbuduj Venner od zera.**

Visage był poprawnym POC (React + Tauri). Próba wciśnięcia komponentów Reacta w architekturę "Agnostic Primitives + Adapters" będzie kosztować więcej niż przepisanie.

**Plan Migracji**:
1.  **Zamrożenie Visage**: Zachowaj jako referencję wizualną.
2.  **Scaffold New Repo**: Struktura z Dokumentu 05.
3.  **Portowanie Zasobów**: Skopiuj pomysły CSS (animacje, layout) do `@venner/ui`.
4.  **Re-implementacja Logiki**: Napisz logikę jako agnostyczną maszynę Zag najpierw, potem adapter SolidJS.

## 4. Wniosek

Visage → myślenie "Faza 1" (Web Developer: "Użyj po prostu Reacta").
Venner → myślenie "Faza 2" (Architekt Frameworka: "Zbuduj agnostyczne prymitywy, adaptery per framework, motyw z systemu").

Przejście z Visage do Venner to przejście od **"Strony WWW w Oknie"** do **"Native-Feeling Desktop App zbudowanej wyłącznie z Web Technologies"**.
