import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// Resolve a short, human-checkable build identifier so the running
// deployment can be confirmed from the UI (login screen footer). Prefers
// the actual git SHA of the checkout being built; falls back to Vercel's
// own commit-SHA env var (set on every Vercel build regardless of local
// git availability), then to "dev" for a plain local `next dev` run.
function resolveAppVersion(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: resolveAppVersion(),
  },
};

export default nextConfig;
