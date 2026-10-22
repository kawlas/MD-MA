import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Embed font files (WOFF2) as base64 data URIs inside the CSS -> single-file build keeps working offline.
  // Default (4096) would emit separate font files; 4MB inlines everything referenced from CSS.
  build: {
    assetsInlineLimit: 4 * 1024 * 1024,
  },
});
