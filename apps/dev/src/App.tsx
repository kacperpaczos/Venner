import { events, store as ssoStore, type AppState, type ImportResult, type ValidationReport } from "@venner/core";
import { Button, Switch, Tabs } from "@venner/solid";
import {
	getThemeDiagnostics,
	getThemeTokens,
	injectGnomeTheme,
	type ThemeDiagnostics,
} from "@venner/themes-gnome";
import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { themeLog } from "./logger";
import "@venner/ui/styles/tokens.css";
import "@venner/ui/styles/button.css";
import "@venner/ui/styles/entry.css";
import "@venner/ui/styles/switch.css";
import "@venner/ui/styles/tabs.css";
import "./App.css";

const WIDGET_IDS = {
	entryEmpty: "entry-empty",
	entryFilled: "entry-filled",
	entryDisabled: "entry-disabled",
	switchOff: "switch-off",
	switchOn: "switch-on",
	switchDisabled: "switch-disabled",
	tabsMain: "tabs-main",
};

function App() {
	const [diagnostics, setDiagnostics] = createSignal<ThemeDiagnostics | null>(null);
	const [tokens, setTokens] = createSignal<Record<string, string>>({});
	const [refreshing, setRefreshing] = createSignal(false);
	const [appState, setAppState] = createSignal<AppState | null>(null);

	const [entryEmpty, setEntryEmpty] = createSignal("");
	const [entryFilled, setEntryFilled] = createSignal("Filled value");
	const [entryDisabled, setEntryDisabled] = createSignal("Disabled");

	const [switchOff, setSwitchOff] = createSignal(false);
	const [switchOn, setSwitchOn] = createSignal(true);
	const [switchDisabled, setSwitchDisabled] = createSignal(true);

	const [activeTab, setActiveTab] = createSignal("general");
	const [tabsRenderKey, setTabsRenderKey] = createSignal(0);

	const [snapshotJson, setSnapshotJson] = createSignal("");
	const [validation, setValidation] = createSignal<ValidationReport | null>(null);
	const [importResult, setImportResult] = createSignal<ImportResult | null>(null);
	const [rehydrateStatus, setRehydrateStatus] = createSignal("idle");

	const entryDebounce = new Map<string, ReturnType<typeof setTimeout>>();

	const sortedTokens = createMemo(() =>
		Object.entries(tokens()).sort(([a], [b]) => a.localeCompare(b)),
	);

	const refreshThemeDiagnostics = async () => {
		setRefreshing(true);
		try {
			const [nextTokens, nextDiagnostics] = await Promise.all([
				getThemeTokens(),
				getThemeDiagnostics(),
			]);
			setTokens(nextTokens);
			setDiagnostics(nextDiagnostics);
			await themeLog.loaded(nextDiagnostics);
			await themeLog.fallback(nextDiagnostics);
		} finally {
			setRefreshing(false);
		}
	};

	const dispatch = (action: unknown) => ssoStore.dispatch(action);

	const registerWidgets = () => {
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.entryEmpty, kind: "entry", initial: { value: "" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.entryFilled, kind: "entry", initial: { value: "Filled value" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.entryDisabled, kind: "entry", initial: { value: "Disabled" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.switchOff, kind: "switch", initial: { checked: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.switchOn, kind: "switch", initial: { checked: true } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.switchDisabled, kind: "switch", initial: { checked: true } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.tabsMain, kind: "tabs", initial: { activeTab: "general" } });
		dispatch({ type: "WidgetDisable", widget_id: WIDGET_IDS.entryDisabled, disabled: true });
		dispatch({ type: "WidgetDisable", widget_id: WIDGET_IDS.switchDisabled, disabled: true });
	};

	const syncFromState = (state: AppState) => {
		const getPersistent = (id: string) => state.widgets[id]?.persistent as Record<string, unknown> | undefined;

		setEntryEmpty(String(getPersistent(WIDGET_IDS.entryEmpty)?.value ?? ""));
		setEntryFilled(String(getPersistent(WIDGET_IDS.entryFilled)?.value ?? "Filled value"));
		setEntryDisabled(String(getPersistent(WIDGET_IDS.entryDisabled)?.value ?? "Disabled"));

		setSwitchOff(Boolean(getPersistent(WIDGET_IDS.switchOff)?.checked ?? false));
		setSwitchOn(Boolean(getPersistent(WIDGET_IDS.switchOn)?.checked ?? true));
		setSwitchDisabled(Boolean(getPersistent(WIDGET_IDS.switchDisabled)?.checked ?? true));

		const tab = state.ui.tabs[WIDGET_IDS.tabsMain] ?? String(getPersistent(WIDGET_IDS.tabsMain)?.activeTab ?? "general");
		setActiveTab(tab);
	};

	const tryFocusByWidgetId = (widgetId: string | null | undefined, caretStart?: number | null, caretEnd?: number | null) => {
		if (!widgetId) return;
		let attempts = 0;
		const maxAttempts = 12;

		const tick = () => {
			attempts += 1;
			const el = document.querySelector<HTMLElement>(`[data-widget-id="${widgetId}"], #${widgetId}, [name="${widgetId}"]`);
			if (el) {
				el.focus();
				if (el instanceof HTMLInputElement && caretStart != null && caretEnd != null) {
					el.setSelectionRange(caretStart, caretEnd);
				}
				return;
			}
			if (attempts < maxAttempts) requestAnimationFrame(tick);
		};

		requestAnimationFrame(tick);
	};

	const applyRehydrate = (state: AppState) => {
		document.body.style.zoom = String(state.session.uiScale || 1);
		const win = state.windows[state.session.currentWindowId] ?? Object.values(state.windows)[0];
		if (win) {
			requestAnimationFrame(() => {
				window.scrollTo({ left: win.scroll?.x ?? 0, top: win.scroll?.y ?? 0 });
			});
		}

		syncFromState(state);
		setTabsRenderKey((v) => v + 1);
		tryFocusByWidgetId(state.ui.focus.widgetId, state.ui.focus.caretStart, state.ui.focus.caretEnd);

		console.info(
			`[ssot] rehydrate route=${state.session.activeRoute} zoom=${state.session.uiScale} scroll=${win?.scroll?.x ?? 0},${win?.scroll?.y ?? 0} focus=${state.ui.focus.widgetId ?? "none"}`,
		);
	};

	const queueEntryPatch = (id: string, value: string) => {
		const prev = entryDebounce.get(id);
		if (prev) clearTimeout(prev);
		entryDebounce.set(
			id,
			setTimeout(() => {
				dispatch({ type: "WidgetStatePatch", widget_id: id, patch: { value, dirty: true } });
			}, 150),
		);
	};

	const commitEntry = (id: string, value: string) => {
		dispatch({ type: "WidgetCommit", widget_id: id, value: { value, dirty: false } });
	};

	const exportSnapshot = async () => {
		const json = await ssoStore.exportSnapshot();
		setSnapshotJson(json);
		setValidation(null);
		setImportResult(null);
	};

	const validateSnapshot = async () => {
		const report = await ssoStore.validateSnapshot(snapshotJson());
		setValidation(report);
	};

	const importSnapshot = async () => {
		setRehydrateStatus("importing");
		const result = await ssoStore.importSnapshot(snapshotJson());
		setImportResult(result);
	};

	onMount(async () => {
		await injectGnomeTheme();
		await refreshThemeDiagnostics();
		registerWidgets();

		const unsubStore = ssoStore.subscribe((state) => {
			setAppState(state);
			syncFromState(state);
		});

		const unlistenTheme = await events.onThemeChange((nextTokens) => setTokens(nextTokens));
		const unlistenDiagnostics = await events.onThemeDiagnostics((nextDiagnostics) => {
			setDiagnostics(nextDiagnostics);
			themeLog.changed(nextDiagnostics);
			themeLog.fallback(nextDiagnostics);
		});

		const unlistenRehydrateStart = await events.onRehydrateStarted(() => {
			setRehydrateStatus("started");
		});
		const unlistenRehydrateDone = await events.onRehydrateCompleted((state) => {
			setRehydrateStatus("completed");
			applyRehydrate(state);
		});

		dispatch({ type: "SessionUpdate", patch: { currentWindowId: "main", activeRoute: "/", workflowStage: "reference", uiScale: 1 } });
		dispatch({ type: "Navigate", window_id: "main", route: "/" });

		const onScroll = () => {
			dispatch({ type: "WindowScroll", window_id: "main", x: window.scrollX, y: window.scrollY, anchor_id: null });
		};
		window.addEventListener("scroll", onScroll, { passive: true });

		onCleanup(() => {
			window.removeEventListener("scroll", onScroll);
			entryDebounce.forEach((timer) => clearTimeout(timer));
			unsubStore();
			unlistenTheme();
			unlistenDiagnostics();
			unlistenRehydrateStart();
			unlistenRehydrateDone();
		});
	});

	return (
		<main class="gtk4-reference-page">
			<section class="gtk4-frame">
				<h2 class="gtk4-label">Button (GTK4)</h2>
				<div class="gtk4-row">
					<Button variant="default" onClick={() => dispatch({ type: "WidgetCommit", widget_id: "button-default", value: { clickedAt: Date.now() } })}>Default</Button>
					<Button variant="suggested" onClick={() => dispatch({ type: "WidgetCommit", widget_id: "button-suggested", value: { clickedAt: Date.now() } })}>Suggested</Button>
					<Button variant="destructive" onClick={() => dispatch({ type: "WidgetCommit", widget_id: "button-destructive", value: { clickedAt: Date.now() } })}>Destructive</Button>
					<Button variant="default" disabled>
						Disabled
					</Button>
				</div>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Entry (GTK4)</h2>
				<div class="gtk4-row">
					<input
						data-widget-id={WIDGET_IDS.entryEmpty}
						class="venner-entry gtk4-entry"
						placeholder="Type here"
						value={entryEmpty()}
						onInput={(e) => {
							const value = e.currentTarget.value;
							setEntryEmpty(value);
							queueEntryPatch(WIDGET_IDS.entryEmpty, value);
						}}
						onBlur={(e) => commitEntry(WIDGET_IDS.entryEmpty, e.currentTarget.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") commitEntry(WIDGET_IDS.entryEmpty, e.currentTarget.value);
						}}
					/>
					<input
						data-widget-id={WIDGET_IDS.entryFilled}
						class="venner-entry gtk4-entry"
						value={entryFilled()}
						onInput={(e) => {
							const value = e.currentTarget.value;
							setEntryFilled(value);
							queueEntryPatch(WIDGET_IDS.entryFilled, value);
						}}
						onBlur={(e) => commitEntry(WIDGET_IDS.entryFilled, e.currentTarget.value)}
					/>
					<input
						data-widget-id={WIDGET_IDS.entryDisabled}
						class="venner-entry gtk4-entry"
						value={entryDisabled()}
						disabled
					/>
				</div>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Switch (GTK4)</h2>
				<div class="gtk4-row">
					<Switch
						checked={switchOff()}
						onChange={(checked) => {
							setSwitchOff(checked);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.switchOff, value: { checked } });
						}}
					/>
					<Switch
						checked={switchOn()}
						onChange={(checked) => {
							setSwitchOn(checked);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.switchOn, value: { checked } });
						}}
					/>
					<Switch checked={switchDisabled()} disabled />
				</div>
			</section>

			<section class="gtk4-frame gtk4-tabs-frame">
				<h2 class="gtk4-label">Tabs via StackSwitcher (GTK4)</h2>
				<div data-key={tabsRenderKey()}>
					<Tabs
						activeTabId={activeTab()}
						onChange={(tabId) => {
							setActiveTab(tabId);
							dispatch({ type: "UiTabsUpdate", id: WIDGET_IDS.tabsMain, active_tab: tabId });
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.tabsMain, value: { activeTab: tabId } });
						}}
						items={[
							{ id: "general", label: "General", content: "General content" },
							{ id: "appearance", label: "Appearance", content: "Appearance content" },
							{ id: "advanced", label: "Advanced", content: "Advanced content" },
						]}
					/>
				</div>
			</section>

			<section class="gtk4-frame diagnostics-frame">
				<div class="diagnostics-header">
					<h2 class="gtk4-label">Theme Diagnostics</h2>
					<button
						type="button"
						class="diagnostics-refresh"
						onClick={refreshThemeDiagnostics}
						disabled={refreshing()}
					>
						{refreshing() ? "Refreshing..." : "Refresh diagnostics"}
					</button>
				</div>

				<Show
					when={diagnostics()}
					fallback={<p class="diagnostics-empty">No diagnostics loaded yet.</p>}
				>
					{(diag) => (
						<div class="diagnostics-grid">
							<div>source: {diag().source}</div>
							<div>desktop: {diag().desktop_env}</div>
							<div>schema: {diag().schema}</div>
							<div>theme: {diag().gtk_theme}</div>
							<div>scheme: {diag().color_scheme}</div>
							<div>gtk version: {diag().resolved_gtk_version}</div>
							<div>css path: {diag().resolved_css_path ?? "<none>"}</div>
							<div>fallback: {diag().fallback_reason ?? "none"}</div>
							<div>tokens: {diag().tokens_count}</div>
							<div>loaded_at: {new Date(diag().loaded_at * 1000).toLocaleString()}</div>
						</div>
					)}
				</Show>

				<div class="diagnostics-tokens">
					<h3>Resolved tokens</h3>
					<pre>
						<For each={sortedTokens()}>
							{([key, value]) => `${key}: ${value}\n`}
						</For>
					</pre>
				</div>
			</section>

			<section class="gtk4-frame diagnostics-frame">
				<div class="diagnostics-header">
					<h2 class="gtk4-label">SSoT Import/Export</h2>
					<div class="ssot-buttons">
						<button type="button" class="diagnostics-refresh" onClick={exportSnapshot}>Export snapshot</button>
						<button type="button" class="diagnostics-refresh" onClick={validateSnapshot}>Validate file</button>
						<button type="button" class="diagnostics-refresh" onClick={importSnapshot}>Import snapshot</button>
					</div>
				</div>

				<textarea
					class="ssot-json"
					value={snapshotJson()}
					onInput={(e) => setSnapshotJson(e.currentTarget.value)}
					placeholder="Snapshot JSON..."
				/>

				<Show when={validation()}>
					{(report) => (
						<div class="diagnostics-grid">
							<div>validation.valid: {String(report().valid)}</div>
							<div>schemaVersion: {String(report().schemaVersion)}</div>
							<div>target: {report().targetSchemaVersion}</div>
							<div>warnings: {report().warnings.join(" | ") || "none"}</div>
							<div>errors: {report().errors.join(" | ") || "none"}</div>
						</div>
					)}
				</Show>

				<Show when={importResult()}>
					{(result) => (
						<div class="diagnostics-grid">
							<div>import.applied: {String(result().applied)}</div>
							<div>migratedFrom: {String(result().migratedFrom)}</div>
							<div>schemaVersion: {result().schemaVersion}</div>
							<div>warnings: {result().warnings.join(" | ") || "none"}</div>
							<div>errors: {result().errors.join(" | ") || "none"}</div>
						</div>
					)}
				</Show>

				<div class="diagnostics-grid">
					<div>rehydrate: {rehydrateStatus()}</div>
					<div>active route: {appState()?.session.activeRoute ?? "/"}</div>
					<div>workflow stage: {appState()?.session.workflowStage ?? "initial"}</div>
					<div>ui scale: {String(appState()?.session.uiScale ?? 1)}</div>
				</div>
			</section>
		</main>
	);
}

export default App;
