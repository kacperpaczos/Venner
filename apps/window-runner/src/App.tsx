import {
  createWindowGraph,
  type CompiledGtkTheme,
  windowController,
  type ThemeDiagnostics,
  type WindowBehaviorProfile,
  type WindowRuntimeState,
} from "@venner/core";
import { ApplicationWindow } from "@venner/solid";
import { getCompiledTheme, getCompiledThemeDiagnostics, getThemeTokens, injectGnomeTheme } from "@venner/themes-gnome";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import "@venner/ui/styles/tokens.css";
import "./App.css";

const DEFAULT_PROFILE: WindowBehaviorProfile = {
  id: "gtk-like",
  nativeDecorations: false,
  chromeStyle: "system-gtk",
  resizable: true,
  allowMinimize: true,
  allowMaximize: true,
  allowFullscreen: true,
  themeMode: "system-follow",
};

const graph = createWindowGraph({ activeWindowId: "main" });
type ResizeDirection = "North" | "South" | "East" | "West" | "NorthEast" | "NorthWest" | "SouthEast" | "SouthWest";

function App() {
  const [tokens, setTokens] = createSignal<Record<string, string>>({});
  const [diagnostics, setDiagnostics] = createSignal<ThemeDiagnostics | null>(null);
  const [compiledTheme, setCompiledTheme] = createSignal<CompiledGtkTheme | null>(null);
  const [runtime, setRuntime] = createSignal<WindowRuntimeState | null>(null);
  const [profile, setProfile] = createSignal<WindowBehaviorProfile>(DEFAULT_PROFILE);
  const [busy, setBusy] = createSignal(false);
  const [graphTick, setGraphTick] = createSignal(0);
  const [transientChildId, setTransientChildId] = createSignal("dialog-settings");
  const [transientParentId, setTransientParentId] = createSignal("main");
  const [focusOwnerId, setFocusOwnerId] = createSignal("entry.search");
  const [logLines, setLogLines] = createSignal<string[]>([]);

  const pushLog = (line: string) => {
    setLogLines((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`].slice(-80));
  };

  const patchRuntime = (patch: Partial<WindowRuntimeState>) => {
    setRuntime((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const refreshTheme = async () => {
    const [nextTokens, nextDiagnostics, nextCompiled] = await Promise.all([
      getThemeTokens(),
      getCompiledThemeDiagnostics(),
      getCompiledTheme(),
    ]);
    setTokens(nextTokens);
    setDiagnostics(nextDiagnostics);
    setCompiledTheme(nextCompiled);
  };

  const refreshRuntime = async () => {
    try {
      const state = await windowController.getState();
      setRuntime(state);
    } catch (error) {
      pushLog(`runtime_refresh_failed: ${String(error)}`);
    }
  };

  const runWindowAction = async (
    label: string,
    fn: () => Promise<{ ok: boolean; error: string | null }>,
    optimisticPatch?: Partial<WindowRuntimeState>,
  ) => {
    const before = runtime();
    if (optimisticPatch && before) {
      patchRuntime(optimisticPatch);
    }
    setBusy(true);
    try {
      const result = await fn();
      if (result.ok) {
        pushLog(`${label}: ok`);
      } else {
        pushLog(`${label}: error=${result.error ?? "unknown"}`);
        if (before) setRuntime(before);
        await refreshRuntime();
      }
    } catch (error) {
      pushLog(`${label}: exception=${String(error)}`);
      if (before) setRuntime(before);
      await refreshRuntime();
    } finally {
      setBusy(false);
    }
  };

  const graphState = createMemo(() => {
    graphTick();
    return graph.getState();
  });

  const startResize = async (direction: ResizeDirection) => {
    try {
      await getCurrentWindow().startResizeDragging(direction);
    } catch (error) {
      pushLog(`resize_drag_failed(${direction}): ${String(error)}`);
    }
  };

  const toggleChromeStyle = () => {
    const next = profile().chromeStyle === "system-gtk" ? "debug-transparent" : "system-gtk";
    setProfile((prev) => ({ ...prev, chromeStyle: next }));
  };

  onMount(async () => {
    await injectGnomeTheme();
    await refreshTheme();
    await refreshRuntime();
    await runWindowAction("apply_profile_on_start", () => windowController.applyProfile(profile()));

    const appWindow = getCurrentWindow();
    const unlistenFns: Array<() => void> = [];
    let resizeSyncTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleResizeSync = () => {
      if (resizeSyncTimer) clearTimeout(resizeSyncTimer);
      resizeSyncTimer = setTimeout(() => {
        refreshRuntime();
      }, 80);
    };

    unlistenFns.push(
      await appWindow.onResized(({ payload }) => {
        patchRuntime({ width: payload.width, height: payload.height });
        scheduleResizeSync();
      }),
    );
    unlistenFns.push(
      await appWindow.onMoved(({ payload }) => {
        patchRuntime({ x: payload.x, y: payload.y });
      }),
    );
    unlistenFns.push(
      await appWindow.onFocusChanged(({ payload }) => {
        patchRuntime({ focused: payload });
      }),
    );
    unlistenFns.push(
      await appWindow.onThemeChanged(() => {
        refreshTheme();
      }),
    );

    const timer = setInterval(() => {
      refreshRuntime();
      refreshTheme();
    }, 7000);

    onCleanup(() => {
      clearInterval(timer);
      if (resizeSyncTimer) clearTimeout(resizeSyncTimer);
      for (const unlisten of unlistenFns) unlisten();
    });
  });

  return (
    <main class="runner-root">
      <section class={`runner-surface ${profile().chromeStyle === "debug-transparent" ? "pink-transparent-mode" : "gtk-window-mode"}`}>
        <button type="button" class="resize-handle n" aria-label="Resize north" onMouseDown={() => startResize("North")} />
        <button type="button" class="resize-handle s" aria-label="Resize south" onMouseDown={() => startResize("South")} />
        <button type="button" class="resize-handle e" aria-label="Resize east" onMouseDown={() => startResize("East")} />
        <button type="button" class="resize-handle w" aria-label="Resize west" onMouseDown={() => startResize("West")} />
        <button type="button" class="resize-handle ne" aria-label="Resize north-east" onMouseDown={() => startResize("NorthEast")} />
        <button type="button" class="resize-handle nw" aria-label="Resize north-west" onMouseDown={() => startResize("NorthWest")} />
        <button type="button" class="resize-handle se" aria-label="Resize south-east" onMouseDown={() => startResize("SouthEast")} />
        <button type="button" class="resize-handle sw" aria-label="Resize south-west" onMouseDown={() => startResize("SouthWest")} />
        <ApplicationWindow
          title="Venner Window"
          subtitle="GTK-like replacement runner"
          chromeMode="custom"
          profile={profile()}
          runtimeState={runtime()}
          onStartDragging={() => runWindowAction("start_dragging", () => windowController.startDragging())}
          onMinimize={() => runWindowAction("minimize", () => windowController.minimize(), { minimized: true, focused: false })}
          onToggleMaximize={() => runWindowAction("toggle_maximize", () => windowController.toggleMaximize(), { maximized: !(runtime()?.maximized ?? false), minimized: false })}
          onCloseRequest={() => runWindowAction("close_request", () => windowController.closeRequest())}
          startSlot={<span class="runner-app-name">Venner</span>}
          endSlot={<span class="runner-theme-tag">{diagnostics()?.colorScheme ?? "system"}</span>}
        >
          <section class="runner-content-grid">
            <article class="runner-card">
              <h3>Runtime State</h3>
              <div class="runner-meta-grid">
                <div>native decorations: {String(runtime()?.nativeDecorations ?? false)}</div>
                <div>resizable: {String(runtime()?.resizable ?? false)}</div>
                <div>maximized: {String(runtime()?.maximized ?? false)}</div>
                <div>minimized: {String(runtime()?.minimized ?? false)}</div>
                <div>fullscreen: {String(runtime()?.fullscreen ?? false)}</div>
                <div>focused: {String(runtime()?.focused ?? false)}</div>
                <div>visible: {String(runtime()?.visible ?? false)}</div>
                <div>x/y: {runtime()?.x ?? "-"}/{runtime()?.y ?? "-"}</div>
                <div>w/h: {runtime()?.width ?? "-"}/{runtime()?.height ?? "-"}</div>
              </div>
            </article>

            <article class="runner-card">
              <h3>Window Controls</h3>
              <div class="runner-toggle-grid">
                <label><input type="checkbox" checked={profile().nativeDecorations} onInput={(e) => setProfile((prev) => ({ ...prev, nativeDecorations: e.currentTarget.checked }))} /> native decorations</label>
                <label><input type="checkbox" checked={profile().resizable} onInput={(e) => setProfile((prev) => ({ ...prev, resizable: e.currentTarget.checked }))} /> resizable</label>
                <label><input type="checkbox" checked={profile().allowMinimize} onInput={(e) => setProfile((prev) => ({ ...prev, allowMinimize: e.currentTarget.checked }))} /> allow minimize</label>
                <label><input type="checkbox" checked={profile().allowMaximize} onInput={(e) => setProfile((prev) => ({ ...prev, allowMaximize: e.currentTarget.checked }))} /> allow maximize</label>
                <label><input type="checkbox" checked={profile().allowFullscreen} onInput={(e) => setProfile((prev) => ({ ...prev, allowFullscreen: e.currentTarget.checked }))} /> allow fullscreen</label>
              </div>
              <div class="runner-actions">
                <button type="button" disabled={busy()} onClick={toggleChromeStyle}>
                  {profile().chromeStyle === "system-gtk" ? "Enable debug chrome" : "Enable GTK chrome"}
                </button>
                <button type="button" disabled={busy()} onClick={() => runWindowAction("apply_profile", () => windowController.applyProfile(profile()))}>Apply profile</button>
                <button type="button" disabled={busy()} onClick={() => runWindowAction("present", () => windowController.present(), { minimized: false, visible: true, focused: true })}>Present</button>
                <button type="button" disabled={busy()} onClick={() => runWindowAction("toggle_fullscreen", () => windowController.setFullscreen(!(runtime()?.fullscreen ?? false)), { fullscreen: !(runtime()?.fullscreen ?? false) })}>{runtime()?.fullscreen ? "Exit fullscreen" : "Fullscreen"}</button>
                <button type="button" disabled={busy()} onClick={() => runWindowAction("toggle_native_decorations", () => windowController.setNativeDecorations(!(runtime()?.nativeDecorations ?? false)))}>Toggle native decorations</button>
                <button type="button" disabled={busy()} onClick={() => runWindowAction("toggle_resizable", () => windowController.setResizable(!(runtime()?.resizable ?? true)))}>Toggle resizable</button>
              </div>
            </article>

            <article class="runner-card">
              <h3>Window Graph</h3>
              <div class="runner-meta-grid">
                <div>active: {graphState().activeWindowId ?? "-"}</div>
                <div>modal stack: {graphState().modalStack.join(", ") || "-"}</div>
                <div>blocked(main): {String(graph.blockedByModal("main"))}</div>
                <div>focusOwner(main): {graphState().focusOwners.main ?? "-"}</div>
              </div>
              <div class="runner-actions">
                <input value={transientChildId()} onInput={(e) => setTransientChildId(e.currentTarget.value)} />
                <input value={transientParentId()} onInput={(e) => setTransientParentId(e.currentTarget.value)} />
                <button type="button" onClick={() => { graph.setTransientFor(transientChildId(), transientParentId() || null); setGraphTick((v) => v + 1); }}>Set transient</button>
                <button type="button" onClick={() => { graph.pushModal(transientChildId()); setGraphTick((v) => v + 1); }}>Push modal</button>
                <button type="button" onClick={() => { graph.popModal(transientChildId()); setGraphTick((v) => v + 1); }}>Pop modal</button>
                <input value={focusOwnerId()} onInput={(e) => setFocusOwnerId(e.currentTarget.value)} />
                <button type="button" onClick={() => { graph.setFocusOwner("main", focusOwnerId() || null); setGraphTick((v) => v + 1); }}>Set focus owner</button>
              </div>
            </article>

            <article class="runner-card runner-log">
              <h3>Diagnostics</h3>
              <pre>{logLines().join("\n")}</pre>
              <pre>{Object.entries(tokens()).slice(0, 10).map(([k, v]) => `${k}: ${v}`).join("\n")}</pre>
              <pre>{[
                `source: ${diagnostics()?.source ?? "-"}`,
                `gtk: ${diagnostics()?.resolvedGtkVersion ?? "-"}`,
                `css: ${diagnostics()?.resolvedCssPath ?? "-"}`,
                `coverage.headerbar: ${diagnostics()?.coverage.window.headerbar?.toFixed?.(2) ?? "-"}`,
                `coverage.windowcontrols: ${diagnostics()?.coverage.window.windowcontrols?.toFixed?.(2) ?? "-"}`,
                `coverage.titleButtons: ${diagnostics()?.coverage.window.titleButtons?.toFixed?.(2) ?? "-"}`,
                `missing selectors: ${(diagnostics()?.missingSelectors ?? []).slice(0, 5).join(", ") || "-"}`,
                `missing props: ${(diagnostics()?.missingProps ?? []).slice(0, 5).join(", ") || "-"}`,
              ].join("\n")}</pre>
              <pre>{[
                `contract: ${compiledTheme()?.meta.contractVersion ?? "-"}`,
                `hash: ${compiledTheme()?.meta.hash ?? "-"}`,
                `close icon source: ${compiledTheme()?.window.titleButtons.close.icon.resolvedSource ?? "-"}`,
                `maximize icon source: ${compiledTheme()?.window.titleButtons.maximize.icon.resolvedSource ?? "-"}`,
                `minimize icon source: ${compiledTheme()?.window.titleButtons.minimize.icon.resolvedSource ?? "-"}`,
                `carrier radius: ${compiledTheme()?.window.windowcontrols.iconCarrier.borderRadius ?? "-"}`,
                `carrier min: ${compiledTheme()?.window.windowcontrols.iconCarrier.minWidth ?? "-"} / ${compiledTheme()?.window.windowcontrols.iconCarrier.minHeight ?? "-"}`,
              ].join("\n")}</pre>
            </article>
          </section>
        </ApplicationWindow>
      </section>
    </main>
  );
}

export default App;
