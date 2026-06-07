import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["PUBLIC_", "VITE_"],
  plugins: [tanstackStart(), react()],
  server: {
    allowedHosts: ["wayguest-admin.dev.dawson.gg"],
    port: Number(process.env.DEV_ADMIN_PORT ?? 5174),
  },
});
