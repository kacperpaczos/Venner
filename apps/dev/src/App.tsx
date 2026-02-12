import { Button } from "@venner/solid";
import { injectGnomeTheme } from "@venner/themes-gnome";
import { termLog } from "./logger";
import "@venner/ui/styles/tokens.css";
import "@venner/ui/styles/button.css";
import "@venner/ui/styles/entry.css";
import "./App.css";

injectGnomeTheme();

function App() {
	return (
		<main class="container">
			<h1>Venner Dev</h1>
			<p>Parity sandbox for GTK4/Libadwaita comparison.</p>
			<section class="parity-section">
				<h2>Button parity scene</h2>
				<div class="parity-row">
					<Button onClick={() => termLog.info("Button clicked")}>Default</Button>
					<Button variant="secondary">Secondary</Button>
					<Button disabled>Disabled</Button>
				</div>
			</section>

			<section class="parity-section">
				<h2>Entry parity scene</h2>
				<div class="parity-row">
					<input
						class="venner-entry"
						placeholder="Type here"
					/>
					<input
						class="venner-entry"
						defaultValue="Filled value"
					/>
					<input
						class="venner-entry"
						defaultValue="Disabled"
						disabled
					/>
				</div>
			</section>

			<div class="parity-notes">
				Compare these scenes with:
				<code>tools/gtk-reference/gtk4-gjs</code>
				and
				<code>tools/gtk-reference/libadwaita-gjs</code>
			</div>
		</main>
	);
}

export default App;
