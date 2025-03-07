import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      // This helps with resolving the dagre module from your local clone
      "dagre": resolve(__dirname, "../index.js"),
    },
  },
  optimizeDeps: {
    include: ["dagre"],
  },
  build: {
    sourcemap: true,
  },
});