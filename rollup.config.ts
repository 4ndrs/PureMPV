import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const plugins = [typescript(), terser()];

export default defineConfig({
  input: "src/purempv.ts",
  output: {
    file: "main.js",
    format: "cjs",
  },
  plugins,
});
