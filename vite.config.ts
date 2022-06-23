import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * https://vitejs.dev/config/
 */
export default defineConfig({
  base: "./",
  build: {
    outDir: "build",
  },
  plugins: [
    react({
      babel: {
        plugins: ["effector/babel-plugin"],
        // Use .babelrc files
        babelrc: false,
        // Use babel.config.js files
        configFile: false,
      },
    }),
  ],
});
