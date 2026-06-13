import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Permite que los tests importen con el alias "@/..." igual que la app.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
