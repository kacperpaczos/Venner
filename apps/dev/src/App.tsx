import { events } from "@venner/core";
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

function App() {
	const [diagnostics, setDiagnostics] = createSignal<ThemeDiagnostics | null>(null);
	const [tokens, setTokens] = createSignal<Record<string, string>>({});
	const [refreshing, setRefreshing] = createSignal(false);

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

	onMount(async () => {
		await injectGnomeTheme();
		await refreshThemeDiagnostics();

		const unlistenTheme = await events.onThemeChange((nextTokens) => {
			setTokens(nextTokens);
		});
		const unlistenDiagnostics = await events.onThemeDiagnostics((nextDiagnostics) => {
			setDiagnostics(nextDiagnostics);
			themeLog.changed(nextDiagnostics);
			themeLog.fallback(nextDiagnostics);
		});

		onCleanup(() => {
			unlistenTheme();
			unlistenDiagnostics();
		});
	});

	return (
		<main class="gtk4-reference-page">
			<section class="gtk4-frame">
				<h2 class="gtk4-label">Button (GTK4)</h2>
				<div class="gtk4-row">
					<Button variant="default">Default</Button>
					<Button variant="suggested">Suggested</Button>
					<Button variant="destructive">Destructive</Button>
					<Button variant="default" disabled>
						Disabled
					</Button>
				</div>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Entry (GTK4)</h2>
				<div class="gtk4-row">
					<input class="venner-entry gtk4-entry" placeholder="Type here" />
					<input class="venner-entry gtk4-entry" value="Filled value" />
					<input class="venner-entry gtk4-entry" value="Disabled" disabled />
				</div>
			</section>

			<section class="gtk4-frame">
				<h2 class="gtk4-label">Switch (GTK4)</h2>
				<div class="gtk4-row">
					<Switch checked={false} />
					<Switch checked />
					<Switch checked disabled />
				</div>
			</section>

			<section class="gtk4-frame gtk4-tabs-frame">
				<h2 class="gtk4-label">Tabs via StackSwitcher (GTK4)</h2>
				<Tabs
					defaultTabId="general"
					items={[
						{ id: "general", label: "General", content: "General content" },
						{ id: "appearance", label: "Appearance", content: "Appearance content" },
						{ id: "advanced", label: "Advanced", content: "Advanced content" },
					]}
				/>
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
		</main>
	);
}

export default App;
