import {
	events,
	store as ssoStore,
	type AboutDialogResult,
	type AppState,
	type ImportResult,
	type NativeDialogResult,
	type ValidationReport,
} from "@venner/core";
import {
	ActionBar,
	Button,
	CenterBox,
	CheckButton,
	ColumnView,
	DrawingArea,
	DropDown,
	Expander,
	FlowBox,
	GridView,
	HeaderBar,
	LevelBar,
	LinkButton,
	ListBox,
	ListView,
	MenuButton,
	Paned,
	PasswordEntry,
	Popover,
	ProgressBar,
	Scale,
	SearchEntry,
	Spinner,
	SpinButton,
	Switch,
	SplitButton,
	Tabs,
	TextView,
	ToggleButton,
	VideoView,
} from "@venner/solid";
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
	toggleMain: "toggle-main",
	checkMain: "check-main",
	spinMain: "spin-main",
	scaleMain: "scale-main",
	listMain: "list-main",
	menuMain: "menu-main",
	searchMain: "search-main",
	passwordMain: "password-main",
	progressMain: "progress-main",
	levelMain: "level-main",
	popoverMain: "popover-main",
	expanderMain: "expander-main",
	panedMain: "paned-main",
	listBoxMain: "listbox-main",
	dropdownMain: "dropdown-main",
	splitButtonMain: "split-button-main",
	textViewMain: "text-view-main",
	gridViewMain: "grid-view-main",
	columnViewMain: "column-view-main",
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
	const [togglePressed, setTogglePressed] = createSignal(false);
	const [checkEnabled, setCheckEnabled] = createSignal(true);
	const [searchValue, setSearchValue] = createSignal("");
	const [passwordValue, setPasswordValue] = createSignal("secret");
	const [spinValue, setSpinValue] = createSignal(12);
	const [progressValue, setProgressValue] = createSignal(62);
	const [scaleValue, setScaleValue] = createSignal(45);
	const [levelValue, setLevelValue] = createSignal(68);
	const [menuOpen, setMenuOpen] = createSignal(false);
	const [popoverOpen, setPopoverOpen] = createSignal(false);
	const [expanderOpen, setExpanderOpen] = createSignal(true);
	const [panedSplit, setPanedSplit] = createSignal(42);
	const [selectedListId, setSelectedListId] = createSignal<string | null>("row-2");
	const [dialogResult, setDialogResult] = createSignal<NativeDialogResult | AboutDialogResult | null>(null);
	const [listBoxActive, setListBoxActive] = createSignal("lb-1");
	const [dropdownValue, setDropdownValue] = createSignal("appearance");
	const [textViewValue, setTextViewValue] = createSignal("Multi-line text sample");

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
	const transient = (widgetId: string, patch: Record<string, unknown>) =>
		dispatch({ type: "WidgetTransient", widget_id: widgetId, transient: patch });

	const registerWidgets = () => {
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.entryEmpty, kind: "entry", initial: { value: "" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.entryFilled, kind: "entry", initial: { value: "Filled value" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.entryDisabled, kind: "entry", initial: { value: "Disabled" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.switchOff, kind: "switch", initial: { checked: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.switchOn, kind: "switch", initial: { checked: true } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.switchDisabled, kind: "switch", initial: { checked: true } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.tabsMain, kind: "tabs", initial: { activeTab: "general" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.toggleMain, kind: "toggle-button", initial: { pressed: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.checkMain, kind: "check-button", initial: { checked: true } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.spinMain, kind: "spin-button", initial: { value: 12 } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.scaleMain, kind: "scale", initial: { value: 45 } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.listMain, kind: "list-view", initial: { selectedId: "row-2", activeIndex: 1 } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.menuMain, kind: "menu-button", initial: { open: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.searchMain, kind: "search-entry", initial: { value: "" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.passwordMain, kind: "password-entry", initial: { value: "secret", revealed: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.progressMain, kind: "progress-bar", initial: { value: 62, max: 100 } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.levelMain, kind: "level-bar", initial: { value: 68, min: 0, max: 100 } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.popoverMain, kind: "popover", initial: { open: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.expanderMain, kind: "expander", initial: { expanded: true } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.panedMain, kind: "paned", initial: { split: 42, min: 15, max: 85 } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.listBoxMain, kind: "list-box", initial: { activeId: "lb-1" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.dropdownMain, kind: "dropdown", initial: { value: "appearance", open: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.splitButtonMain, kind: "split-button", initial: { menuOpen: false } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.textViewMain, kind: "text-view", initial: { value: "Multi-line text sample" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.gridViewMain, kind: "grid-view", initial: { selectedId: "grid-1" } });
		dispatch({ type: "WidgetRegister", widget_id: WIDGET_IDS.columnViewMain, kind: "column-view", initial: { sortBy: "name" } });
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
		setTogglePressed(Boolean(getPersistent(WIDGET_IDS.toggleMain)?.pressed ?? false));
		setCheckEnabled(Boolean(getPersistent(WIDGET_IDS.checkMain)?.checked ?? true));
		setSpinValue(Number(getPersistent(WIDGET_IDS.spinMain)?.value ?? 12));
		setScaleValue(Number(getPersistent(WIDGET_IDS.scaleMain)?.value ?? 45));
		setSelectedListId(String(getPersistent(WIDGET_IDS.listMain)?.selectedId ?? "row-2"));
		setMenuOpen(Boolean(getPersistent(WIDGET_IDS.menuMain)?.open ?? false));
		setSearchValue(String(getPersistent(WIDGET_IDS.searchMain)?.value ?? ""));
		setPasswordValue(String(getPersistent(WIDGET_IDS.passwordMain)?.value ?? "secret"));
		setProgressValue(Number(getPersistent(WIDGET_IDS.progressMain)?.value ?? 62));
		setLevelValue(Number(getPersistent(WIDGET_IDS.levelMain)?.value ?? 68));
		setPopoverOpen(Boolean(getPersistent(WIDGET_IDS.popoverMain)?.open ?? false));
		setExpanderOpen(Boolean(getPersistent(WIDGET_IDS.expanderMain)?.expanded ?? true));
		setPanedSplit(Number(getPersistent(WIDGET_IDS.panedMain)?.split ?? 42));
		setListBoxActive(String(getPersistent(WIDGET_IDS.listBoxMain)?.activeId ?? "lb-1"));
		setDropdownValue(String(getPersistent(WIDGET_IDS.dropdownMain)?.value ?? "appearance"));
		setTextViewValue(String(getPersistent(WIDGET_IDS.textViewMain)?.value ?? "Multi-line text sample"));

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

	const openFileDialog = async () => {
		setDialogResult(await ssoStore.openFileDialog());
	};

	const openColorDialog = async () => {
		setDialogResult(await ssoStore.openColorDialog());
	};

	const openFontDialog = async () => {
		setDialogResult(await ssoStore.openFontDialog());
	};

	const showAboutDialog = async () => {
		setDialogResult(await ssoStore.showAboutDialog());
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

	const listItems = [
		{ id: "row-1", label: "General", description: "Workspace and window options" },
		{ id: "row-2", label: "Appearance", description: "Theme, tokens and metrics" },
		{ id: "row-3", label: "Shortcuts", description: "Keyboard and action mapping" },
		{ id: "row-4", label: "Advanced", description: "Debugging and diagnostics" },
	];

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

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Controls + Input (Breadth-First)</h2>
				<div class="gtk4-row">
					<ToggleButton
						pressed={togglePressed()}
						onPressedChange={(pressed) => {
							setTogglePressed(pressed);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.toggleMain, value: { pressed } });
							transient(WIDGET_IDS.toggleMain, { pressed });
						}}
					>
						Toggle Button
					</ToggleButton>
					<CheckButton
						checked={checkEnabled()}
						label="Check Button"
						onChange={(checked) => {
							setCheckEnabled(checked);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.checkMain, value: { checked } });
							transient(WIDGET_IDS.checkMain, { checked });
						}}
					/>
					<LinkButton
						href="https://docs.gtk.org/gtk4/"
						onClick={() => transient("link-docs", { clicked: true })}
					>
						GTK4 Docs
					</LinkButton>
					<MenuButton
						label="Menu Button"
						open={menuOpen()}
						onOpenChange={(open) => {
							setMenuOpen(open);
							dispatch({ type: "WidgetStatePatch", widget_id: WIDGET_IDS.menuMain, patch: { open } });
							transient(WIDGET_IDS.menuMain, { open });
						}}
					>
						<button type="button" class="venner-button" data-variant="default" onClick={() => setMenuOpen(false)}>First item</button>
						<button type="button" class="venner-button" data-variant="default" onClick={() => setMenuOpen(false)}>Second item</button>
					</MenuButton>
				</div>

				<div class="gtk4-row">
					<SearchEntry
						value={searchValue()}
						placeholder="Search entry"
						onInput={(value) => {
							setSearchValue(value);
							dispatch({ type: "WidgetStatePatch", widget_id: WIDGET_IDS.searchMain, patch: { value } });
							transient(WIDGET_IDS.searchMain, { dirty: true });
						}}
					/>
					<PasswordEntry
						value={passwordValue()}
						onInput={(value) => {
							setPasswordValue(value);
							dispatch({ type: "WidgetStatePatch", widget_id: WIDGET_IDS.passwordMain, patch: { value } });
							transient(WIDGET_IDS.passwordMain, { dirty: true });
						}}
					/>
					<SpinButton
						value={spinValue()}
						min={0}
						max={99}
						step={1}
						onChange={(value) => {
							setSpinValue(value);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.spinMain, value: { value } });
							transient(WIDGET_IDS.spinMain, { active: true });
						}}
					/>
				</div>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Indicators + Layout</h2>
				<div class="gtk4-row">
					<ProgressBar value={progressValue()} />
					<Spinner active />
					<Scale
						value={scaleValue()}
						onChange={(value) => {
							setScaleValue(value);
							setProgressValue(value);
							setLevelValue(value);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.scaleMain, value: { value } });
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.progressMain, value: { value, max: 100 } });
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.levelMain, value: { value, min: 0, max: 100 } });
							transient(WIDGET_IDS.scaleMain, { dragging: true });
						}}
					/>
					<LevelBar value={levelValue()} />
				</div>
				<div class="gtk4-row">
					<Popover
						label="Popover"
						open={popoverOpen()}
						onOpenChange={(open) => {
							setPopoverOpen(open);
							dispatch({ type: "WidgetStatePatch", widget_id: WIDGET_IDS.popoverMain, patch: { open } });
							transient(WIDGET_IDS.popoverMain, { open });
						}}
						content={
							<div class="gtk4-popover-content">
								<div>GTK4-style transient panel</div>
								<Button variant="suggested" onClick={() => setPopoverOpen(false)}>Close</Button>
							</div>
						}
					/>
					<Expander
						title="Expander"
						expanded={expanderOpen()}
						onExpandedChange={(expanded) => {
							setExpanderOpen(expanded);
							dispatch({ type: "UiPanelUpdate", id: WIDGET_IDS.expanderMain, collapsed: !expanded });
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.expanderMain, value: { expanded } });
							transient(WIDGET_IDS.expanderMain, { expanded });
						}}
					>
						Expanded content for parity checks
					</Expander>
				</div>
				<Paned
					split={panedSplit()}
					onSplitChange={(split) => {
						setPanedSplit(split);
						dispatch({ type: "WidgetStatePatch", widget_id: WIDGET_IDS.panedMain, patch: { split } });
						transient(WIDGET_IDS.panedMain, { resizing: true });
					}}
					start={<div>Start pane</div>}
					end={<div>End pane</div>}
				/>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">ListView (Model-View Filar)</h2>
				<ListView
					items={listItems}
					selectedId={selectedListId()}
					onSelect={(id) => {
						setSelectedListId(id);
						dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.listMain, value: { selectedId: id, selectedIds: [id] } });
						transient(WIDGET_IDS.listMain, { activeIndex: listItems.findIndex((item) => item.id === id) });
					}}
				/>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Stage 2 Widgets</h2>
				<HeaderBar
					title="HeaderBar"
					start={<Button variant="default">Back</Button>}
					end={<SplitButton label="Run" onPrimary={() => transient(WIDGET_IDS.splitButtonMain, { primary: true })} onMenu={() => transient(WIDGET_IDS.splitButtonMain, { menu: true })} />}
				/>
				<CenterBox
					start={<span>Start</span>}
					center={<span>CenterBox</span>}
					end={<span>End</span>}
				/>
				<div class="gtk4-row">
					<DropDown
						items={[
							{ id: "general", label: "General" },
							{ id: "appearance", label: "Appearance" },
							{ id: "advanced", label: "Advanced" },
						]}
						value={dropdownValue()}
						onChange={(value) => {
							setDropdownValue(value);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.dropdownMain, value: { value, open: false } });
						}}
					/>
					<ListBox
						items={[
							{ id: "lb-1", label: "Flow item 1" },
							{ id: "lb-2", label: "Flow item 2" },
							{ id: "lb-3", label: "Flow item 3" },
						]}
						activeId={listBoxActive()}
						onChange={(id) => {
							setListBoxActive(id);
							dispatch({ type: "WidgetCommit", widget_id: WIDGET_IDS.listBoxMain, value: { activeId: id } });
						}}
					/>
				</div>
				<FlowBox
					items={[
						<Button variant="default">Item A</Button>,
						<Button variant="default">Item B</Button>,
						<Button variant="default">Item C</Button>,
					]}
				/>
				<ActionBar>
					<Button variant="default">Cancel</Button>
					<Button variant="suggested">Apply</Button>
				</ActionBar>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Stage 3 Widgets</h2>
				<div class="gtk4-row">
					<TextView
						value={textViewValue()}
						onInput={(value) => {
							setTextViewValue(value);
							dispatch({ type: "WidgetStatePatch", widget_id: WIDGET_IDS.textViewMain, patch: { value } });
						}}
					/>
					<DrawingArea />
				</div>
				<GridView
					items={[
						{ id: "grid-1", label: "Card 1" },
						{ id: "grid-2", label: "Card 2" },
						{ id: "grid-3", label: "Card 3" },
						{ id: "grid-4", label: "Card 4" },
					]}
				/>
				<ColumnView
					columns={["name", "value", "state"]}
					rows={[
						{ name: "alpha", value: "12", state: "ok" },
						{ name: "beta", value: "8", state: "warn" },
						{ name: "gamma", value: "17", state: "ok" },
					]}
				/>
				<VideoView src="" />
			</section>

			<section class="gtk4-frame diagnostics-frame">
				<div class="diagnostics-header">
					<h2 class="gtk4-label">Native Dialog Wrappers</h2>
					<div class="ssot-buttons">
						<button type="button" class="diagnostics-refresh" onClick={openFileDialog}>Open File</button>
						<button type="button" class="diagnostics-refresh" onClick={openColorDialog}>Open Color</button>
						<button type="button" class="diagnostics-refresh" onClick={openFontDialog}>Open Font</button>
						<button type="button" class="diagnostics-refresh" onClick={showAboutDialog}>About</button>
					</div>
				</div>
				<Show when={dialogResult()}>
					{(result) => (
						<div class="diagnostics-grid">
							<div>applied: {String(result().applied)}</div>
							<div>
								cancelled:{" "}
								{"cancelled" in result()
									? String((result() as NativeDialogResult).cancelled)
									: "n/a"}
							</div>
							<div>
								value:{" "}
								{"value" in result()
									? String((result() as NativeDialogResult).value ?? "none")
									: "n/a"}
							</div>
							<div>error: {result().error ?? "none"}</div>
						</div>
					)}
				</Show>
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
