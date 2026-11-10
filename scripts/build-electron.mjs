import { build } from "esbuild";
// Electron 44 downloads its runtime lazily. Resolve it before packaging with
// electronDist so `npm ci && npm run dist` also works in a clean checkout.
await import("electron");
await build({
  entryPoints: ["electron/main.ts", "electron/preload.ts"],
  outdir: "dist-electron",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron"],
  sourcemap: true,
});
