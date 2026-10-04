import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // amazon-cognito-identity-js reads Node's `global` while loading.
  define: {
    global: "globalThis",
  },
  server: {
    port: 5173,
  },
});
