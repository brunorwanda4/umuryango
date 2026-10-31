import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname),
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: "es2022",
  },
  resolve: {
    alias: {
      "@native": path.resolve(__dirname, "src"),
      "@contracts": path.resolve(__dirname, "../../contracts"),
    },
  },
});
