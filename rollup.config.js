import { defineConfig } from "rollup";
import rollupHtml from "rollup-plugin-html";
import rollupImage from "@rollup/plugin-image";
import rollupReplace from "@rollup/plugin-replace";
import { join } from "path";
import { terser as rollupTerser } from "rollup-plugin-terser";
import rollupJSON from "@rollup/plugin-json";
import rollupCommonJS from "@rollup/plugin-commonjs";
import rollupNodeResolve from "@rollup/plugin-node-resolve";

/**
 * @typedef {'umd' | 'cjs' | 'esm-bundler'} OutputFormat
 */

/**
 * @param {OutputFormat} format
 * @param {boolean} minify
 * @returns {import('rollup').RollupOptions}
 */
function createOption(format, minify) {
  const name = `nwjs-window-manager${format === "umd" ? "" : `.${format}`}${
    minify ? ".min" : ""
  }.js`;
  return {
    input: join(__dirname, "lib/window-manager.js"),
    output: {
      file: join(__dirname, "dist", name),
      format: format === "esm-bundler" ? "esm" : format,
      name: "nwjs-window-manager",
      exports: "named",
    },
    plugins: [
      rollupHtml({
        include: "**/*.html",
      }),
      rollupImage(),
      rollupReplace({
        delimiters: ["", ""],
        preventAssignment: true,
        values: {
          "process.env.NODE_ENV": replaceProcessNodeEnv(format, minify),
          __DEV__: replaceDev(format, minify),
          __VERSION__: JSON.stringify(require("./package.json").version),
        },
      }),
      rollupNodeResolve({
        mainFields: ["browser", "module", "main"],
      }),
      rollupJSON(),
      rollupCommonJS({
        transformMixedEsModules: true,
        extensions: [".js", "jsx", ".ts", ".tsx"],
      }),
      {
        name: "typescript-class-pure",
        transform(code) {
          return code.replace(
            /\/\*\* @class \*\/ \(function/g,
            "/*#__PURE__*/ (function"
          );
        },
      },
      ...(minify
        ? [
            rollupTerser({
              output: {
                comments: false,
              },
              module: format === "esm-bundler",
            }),
          ]
        : []),
    ],
  };
}

/**
 * @param {OutputFormat} format
 * @param {boolean} minify
 * @returns {string}
 */
function replaceProcessNodeEnv(format, minify) {
  switch (format) {
    case "umd":
    case "cjs":
      return minify ? '"production"' : '"development"';
    case "esm-bundler":
      return "process.env.NODE_ENV";
    default:
      throw new TypeError(`Unsupport format: ${format}`);
  }
}

function replaceDev(format, minify) {
  switch (format) {
    case "umd":
    case "cjs":
      return minify ? "false" : "true";
    case "esm-bundler":
      return 'process.env.NODE_ENV !== "production"';
    default:
      throw new TypeError(`Unsupport format: ${format}`);
  }
}

export default defineConfig([
  createOption("umd", false),
  createOption("umd", true),
  createOption("cjs", false),
  createOption("cjs", true),
  createOption("esm-bundler", false),
]);
