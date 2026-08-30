import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Código generado / build — no se lintea
  globalIgnores(["dist", "generated", "lib", "node_modules"]),

  // ─── Frontend TypeScript (browser + React) ────────────────────────────────
  // El grueso de src/ son .ts/.tsx: sin este bloque ESLint solo veía el backend.
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      // tsc ya reporta variables sin usar; aquí solo se permite el prefijo _
      // como marca explícita de "descartado a propósito".
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },

  // ─── Frontend JavaScript heredado ─────────────────────────────────────────
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },

  // ─── Backend / scripts / config (Node) ────────────────────────────────────
  {
    files: ["server/**/*.js", "scripts/**/*.js", "api/**/*.js", "*.config.js", "*.cjs"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.node },
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // ─── Excepciones a react-refresh/only-export-components ───────────────────
  // La regla protege el Fast Refresh (DX), no la corrección. Se apaga solo
  // donde separar exports pelearía con la herramienta o con el patrón:
  //  - components/ui: primitivas generadas por el CLI de shadcn, que exportan
  //    su cva (`buttonVariants`, `badgeVariants`) junto al componente. Partirlas
  //    rompe la ruta de actualización del CLI.
  //  - context: un provider convive a propósito con su hook y sus defaults;
  //    separarlos en tres archivos por archivo de contexto no aporta nada.
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/context/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },

  // ─── Scripts y tests en TypeScript (Node) ─────────────────────────────────
  {
    files: ["scripts/**/*.ts", "prisma/**/*.ts", "src/**/*.test.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.node },
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]);
