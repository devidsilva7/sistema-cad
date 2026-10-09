// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "load-server-secrets",
      enforce: "pre",
      config(_config, { mode }) {
        for (const key of [
          "ADMIN_EMAIL",
          "ADMIN_PASSWORD",
          "SESSION_SECRET",
        ] as const) {
          if (!process.env[key]?.trim()) delete process.env[key];
        }
        const env = loadEnv(mode, process.cwd(), "");
        const keys = ["ADMIN_EMAIL", "ADMIN_PASSWORD", "SESSION_SECRET"] as const;
        for (const key of keys) {
          if (env[key]?.trim()) process.env[key] = env[key];
        }
      },
    },
  ],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
