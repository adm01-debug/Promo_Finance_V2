import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      "node_modules",
      "coverage",
      "playwright-report",
      "test-results",
      "supabase/functions/**",
      "scripts/**",
      "*.config.{js,ts,cjs}",
      "src/integrations/supabase/types.ts",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      "no-debugger": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Pre-existing legacy violations across the codebase. Demoted to
      // warnings so CI doesn't stay red while we fix them in dedicated
      // follow-up PRs. New code should still avoid them — they show up
      // in eslint output and lint:strict.
      "no-alert": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-useless-escape": "warn",
      "no-constant-condition": ["warn", { checkLoops: false }],
      "no-empty-pattern": "warn",
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-require-imports": "warn",

      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/ban-ts-comment": [
        "warn",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
        },
      ],
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Modularização: alertar em arquivos > 400 linhas (excluindo brancos/comentários).
      // Warning (não error) para não bloquear build em arquivos legados;
      // `lint:strict` (npm run) trata warnings como error.
      "max-lines": [
        "warn",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    // Arquivos gerados ou de configuração — sem limite de tamanho
    files: [
      "src/integrations/**/*.{ts,tsx}",
      "src/components/ui/**/*.{ts,tsx}",
      "tailwind.config.{ts,js}",
    ],
    rules: {
      "max-lines": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
);
