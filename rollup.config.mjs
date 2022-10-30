import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";

export default {
  input: "src/purempv.js",
  output: {
    file: "main.js",
    format: "cjs",
  },
  plugins: [resolve(), babel({ babelHelpers: "bundled" })],
};
