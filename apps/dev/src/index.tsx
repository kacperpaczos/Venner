/* @refresh reload */
import { render } from "solid-js/web";
import { store } from "@venner/core";
import { termLog } from "./logger";
import App from "./App";

// Jeden log na błąd — guard przed spamem przy kaskadzie rejectów
let lastErrorLog = "";
const DEBOUNCE_MS = 500;

window.addEventListener("error", (event) => {
	const msg = `[window.error] ${event.message} @ ${event.filename}:${event.lineno}`;
	if (msg !== lastErrorLog) {
		lastErrorLog = msg;
		termLog.error(msg);
		setTimeout(() => { lastErrorLog = ""; }, DEBOUNCE_MS);
	}
});

window.addEventListener("unhandledrejection", (event) => {
	const msg = `[unhandledrejection] ${String(event.reason)}`;
	if (msg !== lastErrorLog) {
		lastErrorLog = msg;
		termLog.error(msg);
		setTimeout(() => { lastErrorLog = ""; }, DEBOUNCE_MS);
	}
});

async function bootstrap() {
	termLog.info("Venner frontend bootstrap started");

	await store.init();
	const root = document.getElementById("root");
	if (root) render(() => <App />, root);

	termLog.info("Venner frontend bootstrap complete");
}

bootstrap();
