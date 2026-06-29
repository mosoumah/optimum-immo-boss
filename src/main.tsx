import { createRoot } from "react-dom/client";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/work-sans/300.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/work-sans/700.css";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:hsl(220 20% 6%);color:hsl(60 10% 95%);font-family:system-ui,sans-serif;padding:24px;text-align:center;">
      <div>
        <h1 style="font-size:24px;margin:0 0 8px;">Application indisponible</h1>
        <p style="margin:0;color:hsl(220 10% 70%);">Le point de montage de l'application est introuvable.</p>
      </div>
    </div>
  `;
} else {
  createRoot(rootElement).render(<App />);
}
