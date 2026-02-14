import type { ThemeDiagnostics } from "@venner/themes-gnome";
import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
	HUB_VIEWERS,
	getViewer,
	listViewerStatus,
	loadViewerManifest,
	loadGtkReferenceSummary,
	pollViewerLogs,
	startThemeViewers,
	startWidgetViewersWithPreset,
	stopViewer,
	type GtkReferenceSummary,
	type ViewerLogEvent,
	type ViewerRuntimeStatus,
	type ViewerTech,
} from "./viewerHub";

interface HubPanelProps {
	vennerTokens: Record<string, string>;
	vennerDiagnostics: ThemeDiagnostics | null;
}

type SidebarSection = "widgets" | "themes";

type WidgetManifest = {
	groups?: { id: string; label: string; widgets: { id: string; label: string; states?: string[] }[] }[];
};

type ThemeManifest = {
	tokens?: { name: string; value: string; group?: string }[];
	palette?: { name: string; value: string }[];
};

type ThemeRuntimeInfo = {
	source: string;
	themeName: string;
	paletteName: string;
	tokensCount: number;
	updatedAt: number;
};

const TECHS: ViewerTech[] = ["gtk4", "adw", "venner"];

export function HubPanel(props: HubPanelProps) {
	const [section, setSection] = createSignal<SidebarSection>("widgets");
	const [busy, setBusy] = createSignal(false);
	const [statuses, setStatuses] = createSignal<ViewerRuntimeStatus[]>([]);
	const [logs, setLogs] = createSignal<ViewerLogEvent[]>([]);
	const [themeRuntime, setThemeRuntime] = createSignal<Record<ViewerTech, ThemeRuntimeInfo | null>>({
		gtk4: null,
		adw: null,
		venner: null,
	});

	const [widgetTechs, setWidgetTechs] = createSignal<Record<ViewerTech, boolean>>({ gtk4: true, adw: false, venner: true });
	const [themeTechs, setThemeTechs] = createSignal<Record<ViewerTech, boolean>>({ gtk4: true, adw: true, venner: true });

	const [widgetManifestGtk4, setWidgetManifestGtk4] = createSignal<WidgetManifest>({});
	const [widgetManifestAdw, setWidgetManifestAdw] = createSignal<WidgetManifest>({});
	const [widgetManifestVenner, setWidgetManifestVenner] = createSignal<WidgetManifest>({});
	const [themeManifestGtk4, setThemeManifestGtk4] = createSignal<ThemeManifest>({});
	const [themeManifestAdw, setThemeManifestAdw] = createSignal<ThemeManifest>({});
	const [themeManifestVenner, setThemeManifestVenner] = createSignal<ThemeManifest>({});
	const [gtkReferenceSummary, setGtkReferenceSummary] = createSignal<GtkReferenceSummary | null>(null);

	const [selectedWidgetId, setSelectedWidgetId] = createSignal("button.default");
	const [selectedGroupId, setSelectedGroupId] = createSignal("button");
	const [selectedState, setSelectedState] = createSignal("default");

	const appendSystemLog = (line: string) => {
		setLogs((prev) => [
			...prev,
			{ viewerId: "hub", stream: "system", line, ts: Math.floor(Date.now() / 1000) },
		].slice(-600));
	};

	const viewerById = (viewerId: string) => HUB_VIEWERS.find((entry) => entry.id === viewerId) ?? null;

	const processThemeDiagnosticsLog = (entry: ViewerLogEvent) => {
		if (entry.stream !== "stdout") return;
		const viewer = viewerById(entry.viewerId);
		if (!viewer || viewer.kind !== "theme") return;

		try {
			const payload = JSON.parse(entry.line) as { method?: string; params?: Record<string, unknown> };
			if (payload.method !== "theme_diagnostics") return;
			const params = payload.params ?? {};
			const tech = viewer.tech;
			setThemeRuntime((prev) => ({
				...prev,
				[tech]: {
					source: String(params.source ?? "manifest-fallback"),
					themeName: String(params.themeName ?? tech),
					paletteName: String(params.paletteName ?? "default"),
					tokensCount: Number(params.tokensCount ?? 0),
					updatedAt: entry.ts,
				},
			}));
		} catch {
			// ignore non-json log lines
		}
	};

	const refreshRuntime = async () => {
		const [nextStatuses, polledLogs] = await Promise.all([listViewerStatus(), pollViewerLogs(180)]);
		setStatuses(nextStatuses);
		if (polledLogs.length > 0) {
			for (const entry of polledLogs) processThemeDiagnosticsLog(entry);
			setLogs((prev) => [...prev, ...polledLogs].slice(-600));
		}
	};

	const enabledWidgetTechs = createMemo<ViewerTech[]>(() => TECHS.filter((tech) => widgetTechs()[tech]));
	const enabledThemeTechs = createMemo<ViewerTech[]>(() => TECHS.filter((tech) => themeTechs()[tech]));

	const widgetList = createMemo(() => {
		const manifest = widgetManifestVenner();
		const out: { id: string; label: string; groupId: string; states: string[] }[] = [];
		for (const group of manifest.groups ?? []) {
			for (const widget of group.widgets ?? []) {
				out.push({
					id: widget.id,
					label: widget.label,
					groupId: group.id,
					states: widget.states ?? ["default"],
				});
			}
		}
		return out;
	});

	const selectWidget = (widgetId: string) => {
		const found = widgetList().find((item) => item.id === widgetId);
		if (!found) return;
		setSelectedWidgetId(found.id);
		setSelectedGroupId(found.groupId);
		setSelectedState(found.states[0] ?? "default");
	};

	const toggleWidgetTech = (tech: ViewerTech, checked: boolean) => {
		setWidgetTechs((prev) => ({ ...prev, [tech]: checked }));
	};

	const toggleThemeTech = (tech: ViewerTech, checked: boolean) => {
		setThemeTechs((prev) => ({ ...prev, [tech]: checked }));
	};

	const runningWidgetCount = createMemo(() => {
		const running = new Set(statuses().filter((status) => status.running).map((status) => status.viewerId));
		let count = 0;
		for (const tech of TECHS) {
			const viewer = getViewer("widget", tech);
			if (viewer && running.has(viewer.id)) count += 1;
		}
		return count;
	});

	const themeBadgeSummary = createMemo(() => {
		const runtime = themeRuntime();
		const activeSources = enabledThemeTechs().filter((tech) => runtime[tech] !== null).length;
		const lastUpdate = Math.max(...enabledThemeTechs().map((tech) => runtime[tech]?.updatedAt ?? 0), 0);
		return {
			activeSources,
			lastUpdate: lastUpdate > 0 ? new Date(lastUpdate * 1000).toLocaleTimeString() : "-",
		};
	});

	const coverageBadge = createMemo(() => {
		const summary = gtkReferenceSummary();
		if (!summary) {
			return {
				widgets: "coverage: n/a",
				themes: "baseline: n/a",
			};
		}
		const c = summary.coverage;
		return {
			widgets: `L3 ${c.l3}/${c.totalRows} (L2:${c.l2} L1:${c.l1} N/A:${c.na})`,
			themes: `GTK ${summary.baseline.gtkVersion} @ ${summary.baseline.gtkSourceTag}`,
		};
	});

	const startWidgets = async () => {
		if (enabledWidgetTechs().length === 0) {
			appendSystemLog("widgets_start_skipped: no tech selected");
			return;
		}
		setBusy(true);
		try {
			await startWidgetViewersWithPreset({
				techs: enabledWidgetTechs(),
				widgetId: selectedWidgetId(),
				groupId: selectedGroupId(),
				state: selectedState(),
			});
			appendSystemLog(`widgets_started: ${enabledWidgetTechs().join(",")}, widget=${selectedWidgetId()}`);
			await refreshRuntime();
		} catch (err) {
			appendSystemLog(`widgets_start_failed: ${String(err)}`);
		} finally {
			setBusy(false);
		}
	};

	const stopWidgets = async () => {
		if (enabledWidgetTechs().length === 0) return;
		setBusy(true);
		try {
			for (const tech of enabledWidgetTechs()) {
				const viewer = getViewer("widget", tech);
				if (!viewer) continue;
				await stopViewer(viewer.id);
			}
			appendSystemLog(`widgets_stopped: ${enabledWidgetTechs().join(",")}`);
			await refreshRuntime();
		} catch (err) {
			appendSystemLog(`widgets_stop_failed: ${String(err)}`);
		} finally {
			setBusy(false);
		}
	};

	const startThemes = async () => {
		if (enabledThemeTechs().length === 0) {
			appendSystemLog("themes_start_skipped: no tech selected");
			return;
		}
		setBusy(true);
		try {
			await startThemeViewers(enabledThemeTechs());
			for (const tech of enabledThemeTechs()) {
				const viewer = getViewer("theme", tech);
				if (!viewer) continue;
				processThemeDiagnosticsLog({
					viewerId: viewer.id,
					stream: "stdout",
					line: JSON.stringify({
						method: "theme_diagnostics",
						params: {
							source: "pending-refresh",
							themeName: tech,
							paletteName: "default",
							tokensCount: 0,
						},
					}),
					ts: Math.floor(Date.now() / 1000),
				});
			}
			appendSystemLog(`themes_started: ${enabledThemeTechs().join(",")}`);
			await refreshRuntime();
		} catch (err) {
			appendSystemLog(`themes_start_failed: ${String(err)}`);
		} finally {
			setBusy(false);
		}
	};

	const stopThemes = async () => {
		if (enabledThemeTechs().length === 0) return;
		setBusy(true);
		try {
			for (const tech of enabledThemeTechs()) {
				const viewer = getViewer("theme", tech);
				if (!viewer) continue;
				await stopViewer(viewer.id);
			}
			appendSystemLog(`themes_stopped: ${enabledThemeTechs().join(",")}`);
			await refreshRuntime();
		} catch (err) {
			appendSystemLog(`themes_stop_failed: ${String(err)}`);
		} finally {
			setBusy(false);
		}
	};

	const themeManifestByTech = (tech: ViewerTech) => {
		switch (tech) {
			case "gtk4":
				return themeManifestGtk4();
			case "adw":
				return themeManifestAdw();
			default:
				return themeManifestVenner();
		}
	};

	const themeCardData = createMemo(() => {
		const runtime = themeRuntime();
		const runningById = new Set(statuses().filter((status) => status.running).map((status) => status.viewerId));
		return TECHS.map((tech) => {
			const viewer = getViewer("theme", tech);
			const running = viewer ? runningById.has(viewer.id) : false;
			const runtimeInfo = runtime[tech];
			const manifest = themeManifestByTech(tech);
			const tokens = tech === "venner"
				? Object.entries(props.vennerTokens).map(([name, value]) => ({ name, value }))
				: (manifest.tokens ?? []);
			const previewTokens = tokens.slice(0, 10);
			const palette = manifest.palette ?? [];
			return {
				tech,
				running,
				source: runtimeInfo?.source ?? "manifest-fallback",
				themeName: runtimeInfo?.themeName ?? (tech === "venner" ? (props.vennerDiagnostics?.gtk_theme ?? "venner") : tech),
				tokensCount: runtimeInfo?.tokensCount ?? (tech === "venner" ? Object.keys(props.vennerTokens).length : tokens.length),
				paletteName: runtimeInfo?.paletteName ?? "default",
				updatedAt: runtimeInfo?.updatedAt,
				palette,
				previewTokens,
			};
		});
	});

	onMount(async () => {
		const [wGtk4, wAdw, wVenner, tGtk4, tAdw, tVenner, summary] = await Promise.all([
			loadViewerManifest("widgets", "gtk4"),
			loadViewerManifest("widgets", "adw"),
			loadViewerManifest("widgets", "venner"),
			loadViewerManifest("themes", "gtk4"),
			loadViewerManifest("themes", "adw"),
			loadViewerManifest("themes", "venner"),
			loadGtkReferenceSummary().catch(() => null),
		]);
		setWidgetManifestGtk4(wGtk4 as WidgetManifest);
		setWidgetManifestAdw(wAdw as WidgetManifest);
		setWidgetManifestVenner(wVenner as WidgetManifest);
		setThemeManifestGtk4(tGtk4 as ThemeManifest);
		setThemeManifestAdw(tAdw as ThemeManifest);
		setThemeManifestVenner(tVenner as ThemeManifest);
		setGtkReferenceSummary(summary);

		const first = (wVenner as WidgetManifest).groups?.[0]?.widgets?.[0];
		if (first) {
			setSelectedWidgetId(first.id);
			setSelectedGroupId((wVenner as WidgetManifest).groups?.[0]?.id ?? "button");
			setSelectedState(first.states?.[0] ?? "default");
		}

		await refreshRuntime();
		const timer = setInterval(() => {
			refreshRuntime();
		}, 1200);
		onCleanup(() => clearInterval(timer));
	});

	return (
		<section class="dev-layout">
			<aside class="dev-sidebar">
				<h2 class="dev-title">Dev</h2>
				<button
					type="button"
					class={`dev-nav-btn ${section() === "widgets" ? "active" : ""}`}
					onClick={() => setSection("widgets")}
				>
					<span>Widgety</span>
					<small>{enabledWidgetTechs().length} tech / {runningWidgetCount()} running</small>
					<small>{coverageBadge().widgets}</small>
				</button>
				<button
					type="button"
					class={`dev-nav-btn ${section() === "themes" ? "active" : ""}`}
					onClick={() => setSection("themes")}
				>
					<span>Motywy</span>
					<small>{themeBadgeSummary().activeSources} active / {themeBadgeSummary().lastUpdate}</small>
					<small>{coverageBadge().themes}</small>
				</button>
				<button type="button" class="dev-nav-btn" disabled>
					<span>Inne</span>
					<small>wkrotce</small>
				</button>
			</aside>

			<div class="dev-main">
				{section() === "widgets" ? (
					<section class="dev-card">
						<h3>Widgety</h3>
						<select class="dev-select" value={selectedWidgetId()} onInput={(e) => selectWidget(e.currentTarget.value)}>
							<For each={widgetList()}>{(item) => <option value={item.id}>{item.label}</option>}</For>
						</select>
						<div class="dev-check-row">
							<label><input type="checkbox" checked={widgetTechs().gtk4} onInput={(e) => toggleWidgetTech("gtk4", e.currentTarget.checked)} /> Gtk4</label>
							<label><input type="checkbox" checked={widgetTechs().adw} onInput={(e) => toggleWidgetTech("adw", e.currentTarget.checked)} /> Adw</label>
							<label><input type="checkbox" checked={widgetTechs().venner} onInput={(e) => toggleWidgetTech("venner", e.currentTarget.checked)} /> Venner</label>
						</div>
						<div class="dev-action-row">
							<button type="button" class="dev-btn" onClick={startWidgets} disabled={busy()}>Start</button>
							<button type="button" class="dev-btn secondary" onClick={stopWidgets} disabled={busy()}>Stop</button>
						</div>
					</section>
				) : (
					<section class="dev-card">
						<h3>Motywy</h3>
						<div class="dev-check-row">
							<label><input type="checkbox" checked={themeTechs().gtk4} onInput={(e) => toggleThemeTech("gtk4", e.currentTarget.checked)} /> Gtk4</label>
							<label><input type="checkbox" checked={themeTechs().adw} onInput={(e) => toggleThemeTech("adw", e.currentTarget.checked)} /> Adw</label>
							<label><input type="checkbox" checked={themeTechs().venner} onInput={(e) => toggleThemeTech("venner", e.currentTarget.checked)} /> Venner</label>
						</div>
						<div class="dev-action-row">
							<button type="button" class="dev-btn" onClick={startThemes} disabled={busy()}>Start</button>
							<button type="button" class="dev-btn secondary" onClick={stopThemes} disabled={busy()}>Stop</button>
						</div>
						<div class="theme-grid">
							<For each={themeCardData()}>
								{(card) => (
									<article class="theme-card">
										<h4>{card.tech.toUpperCase()}</h4>
										<div class="theme-meta">
											<div>status: {card.running ? "running" : "stopped"}</div>
											<div>source: {card.source}</div>
											<div>theme: {card.themeName}</div>
											<div>palette: {card.paletteName}</div>
											<div>tokens: {card.tokensCount}</div>
											<div>updated: {card.updatedAt ? new Date(card.updatedAt * 1000).toLocaleTimeString() : "-"}</div>
										</div>
										<div class="palette-mini">
											<For each={card.palette.slice(0, 6)}>
												{(swatch) => (
													<div class="swatch-chip">
														<div class="swatch-color" style={{ "background-color": swatch.value }} />
														<small>{swatch.name}</small>
													</div>
												)}
											</For>
										</div>
										<pre class="tokens-preview">
											<For each={card.previewTokens}>{(token) => `${token.name}: ${token.value}\n`}</For>
										</pre>
									</article>
								)}
							</For>
						</div>
					</section>
				)}

				<section class="dev-card">
					<h3>Activity</h3>
					<pre class="activity-log">
						<For each={logs()}>{(entry) => `[${new Date(entry.ts * 1000).toLocaleTimeString()}] ${entry.viewerId} ${entry.stream}: ${entry.line}\n`}</For>
					</pre>
				</section>
			</div>
		</section>
	);
}
