import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Read VITE_* vars from the monorepo root .env.
  envDir: "../../",
  server: { port: 5173 },
});
