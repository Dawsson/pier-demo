import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["DEV_", "PUBLIC_", "VITE_"],
  plugins: [tailwindcss(), tanstackStart(), react()],
  resolve: {
    alias: {
      "#": fileURLToPath(new URL("../api/src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    allowedHosts: ["pierdemo.dev.dawson.gg"],
    port: Number(process.env.DEV_WEB_PORT ?? 5173),
  },
});
