/* @refresh reload */
import { render } from "solid-js/web";
import { store } from "@venner/core";
import App from "./App";

async function bootstrap() {
	await store.init();
	const root = document.getElementById("root");
	if (root) render(() => <App />, root);
}

bootstrap();
