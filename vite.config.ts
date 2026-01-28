import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

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
        babelrc: false,
        configFile: false,
      },
    }),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "build/electron",
            rollupOptions: {
              external: [
                "electron",
                "electron-devtools-installer",
                "electron-liquid-glass",
              ],
            },
          },
        },
      },
      {
        entry: "electron/preload.ts",
        vite: {
          build: {
            outDir: "build/electron",
          },
        },
        onstart(args) {
          // Не перезапускаем electron при изменении preload
          args.reload();
        },
      },
    ]),
    renderer(),
  ],
});
