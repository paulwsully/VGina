import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig({
  base: "./",
  server: {
    port: 3000,
  },
  plugins: [react(), commonjs()],
  build: {
    rollupOptions: {
      output: {
        interop: "compat",
      },
    },
  },
});
