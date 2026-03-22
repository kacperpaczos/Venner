import { invoke } from "@venner/core";
import { getThemeDiagnostics, getThemeTokens, injectGnomeTheme, type ThemeDiagnostics } from "@venner/themes-gnome";
import { createSignal, onMount } from "solid-js";
import { HubPanel } from "./HubPanel";
import "@venner/ui/styles/tokens.css";
import "./App.css";

function App() {
	const [diagnostics, setDiagnostics] = createSignal<ThemeDiagnostics | null>(null);
	const [tokens, setTokens] = createSignal<Record<string, string>>({});

	const refreshTheme = async () => {
		const [nextTokens, nextDiagnostics] = await Promise.all([getThemeTokens(), getThemeDiagnostics()]);
		setTokens(nextTokens);
		setDiagnostics(nextDiagnostics);
	};

	onMount(async () => {
		try {
			const desktopEnv = await invoke<string>("get_desktop_env");
			if (desktopEnv === "kde") {
				const { injectKdeTheme } = await import("@venner/themes-kde");
				await injectKdeTheme();
			} else {
				await injectGnomeTheme();
			}
		} catch {
			await injectGnomeTheme();
		}
		await refreshTheme();
	});

	return (
		<main class="dev-shell">
			<HubPanel vennerTokens={tokens()} vennerDiagnostics={diagnostics()} />
		</main>
	);
}

export default App;
