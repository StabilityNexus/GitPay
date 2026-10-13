import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset URLs, so the build works under https://<org>.github.io/<repo>/
  // without hard-coding the repository name.
  base: "./",
  plugins: [react()],
  server: {
    // The policy playground imports the Action's own pure core modules
    // (src/core/policy.ts, amount.ts, idempotency.ts) instead of a copy.
    fs: { allow: [".", "../src/core"] },
  },
});
