import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  sourcemap: true,
  external: [
    "pino-pretty",
    "pino-worker",
    "pino-file",
    "thread-stream",
  ],
});

console.log("Server built → dist/index.mjs");
