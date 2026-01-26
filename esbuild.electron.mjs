import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["electron/main.ts", "electron/preload.ts"],
  bundle: true,
  platform: "node",
  outdir: "build/electron",
  external: [
    "electron",
    "electron-reload",
    "electron-devtools-installer",
  ],
});
