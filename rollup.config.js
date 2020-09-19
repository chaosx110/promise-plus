import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";

const config = {
  input: "src/index.js",
  output: {
    dir: "lib",
    format: "esm",
  },
  plugins: [
    babel({
      extensions: [".js", ".ts"],
      exclude: "node_modules/**",
      babelHelpers: "bundled",
    }),
    commonjs(),
  ],
};

export default config;
