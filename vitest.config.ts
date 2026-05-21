import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    exclude: ["external/**", "node_modules/**", "dist/**", "coverage/**"]
  }
});
