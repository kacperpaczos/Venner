import { Button } from "@venner/solid";
import { injectGnomeTheme } from "@venner/themes-gnome";
import "@venner/ui/styles/tokens.css";
import "./App.css";

injectGnomeTheme();

function App() {
  return (
    <main class="container">
      <h1>Venner Dev</h1>
      <p>Przycisk w stylu GNOME (motyw z systemu).</p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
        <Button onClick={() => console.log("clicked!")}>Click me</Button>
        <Button variant="secondary">Secondary</Button>
        <Button disabled>Disabled</Button>
      </div>
    </main>
  );
}

export default App;
