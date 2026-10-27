import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Sépare les grosses dépendances : le premier chargement ne transporte
        // que la coquille de l'application et les modules de la page demandée.
        manualChunks(id) {
          // Helper d'import dynamique de Vite : isolé dans son propre chunk,
          // sinon il est rattaché à un gros chunk (ex. pdf) et le force dans le
          // premier chargement.
          if (id.includes("vite/preload-helper") || id.includes("vite/modulepreload-polyfill")) {
            return "vite-helpers";
          }

          if (!id.includes("node_modules")) return;

          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }
          if (
            id.includes("@supabase") ||
            id.includes("postgrest") ||
            id.includes("realtime-js") ||
            id.includes("gotrue")
          ) {
            return "supabase-vendor";
          }
          if (id.includes("@tanstack")) return "query-vendor";
          if (id.includes("react-day-picker")) return "datepicker-vendor";
          if (
            id.includes("sonner") ||
            id.includes("next-themes") ||
            id.includes("clsx") ||
            id.includes("class-variance-authority") ||
            id.includes("tailwind-merge")
          ) {
            return "ui-vendor";
          }
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) {
            return "charts-vendor";
          }
          if (
            id.includes("react-markdown") ||
            id.includes("remark-") ||
            id.includes("micromark") ||
            id.includes("mdast") ||
            id.includes("hast") ||
            id.includes("unified") ||
            id.includes("unist") ||
            id.includes("vfile") ||
            id.includes("gfm")
          ) {
            return "markdown-vendor";
          }
          if (
            id.includes("jspdf") ||
            id.includes("html2canvas") ||
            id.includes("purify") ||
            id.includes("canvg") ||
            id.includes("dompurify") ||
            id.includes("fflate") ||
            id.includes("fast-png")
          ) {
            return "pdf-vendor";
          }
          if (id.includes("date-fns")) return "date-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (id.includes("framer-motion")) return "motion-vendor";
          if (id.includes("@remix-run")) return "react-vendor";

          // Pas de chunk fourre-tout : les modules restants sont laissés à
          // Rollup, qui les rattache au chunk qui les importe. Un chunk
          // « vendor » global serait chargé au premier écran même pour du code
          // utilisé uniquement par une page lointaine.
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    force: false,
  },
}));
