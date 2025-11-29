import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  clean: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  bundle: true,
  skipNodeModulesBundle: false,
  noExternal: [/.*/], // Bundle all dependencies
  platform: "node",
});
