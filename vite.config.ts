import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reactClickToComponent } from "./plugins/react-click-to-component/index";

export default defineConfig({
  plugins: [
    react(),
    reactClickToComponent(), // dev-only, auto no-ops in production builds
  ],
});
