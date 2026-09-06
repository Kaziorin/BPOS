import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Gradual typing plan: ~181 pre-existing `any` usages across list pages are
      // tracked as warnings so CI stays green; fix them incrementally per module.
      "@typescript-eslint/no-explicit-any": "warn",
      // Data-fetch-on-mount (useEffect → setState) is the current list-page pattern;
      // refactoring page by page — keep visible as warnings until then.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
