import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  base: "./",
  plugins: [preact()],
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/codemirror") || id.includes("node_modules/@codemirror")) {
            return "codemirror";
          }
          if (id.includes("node_modules/mermaid")) {
            return "mermaid";
          }
          if (id.includes("node_modules/cytoscape") || id.includes("node_modules/sigma") || id.includes("node_modules/graphology")) {
            return "graph-viewers";
          }
        }
      }
    }
  }
});
