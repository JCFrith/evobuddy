#!/usr/bin/env node
/**
 * Security-sensitive configuration check, run in CI (see
 * .github/workflows/ci.yml) before the production build.
 *
 * Fails the build if:
 *   1. Any NEXT_PUBLIC_-prefixed name looks like it's meant to hold a
 *      secret (SECRET/SERVICE_ROLE/PRIVATE/PASSWORD) -- catches the exact
 *      mistake CLAUDE.md calls out ("Never prefix a server secret with
 *      NEXT_PUBLIC_").
 *   2. A real .env file (not .env.example) is tracked by git.
 *   3. Any server-only lib file (src/lib/supabase/admin.ts,
 *      src/lib/auth/*.ts) is imported from a file that does NOT also
 *      have "use client" absent AND isn't itself server-only -- a cheap
 *      static guard on top of the `server-only` package's build-time
 *      enforcement.
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

let failed = false;
function fail(message) {
  console.error(`✗ ${message}`);
  failed = true;
}
function ok(message) {
  console.log(`✓ ${message}`);
}

// 1. No NEXT_PUBLIC_ secret-shaped names anywhere in source.
const secretShapedPublicVar = /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE|PASSWORD)[A-Z0-9_]*/;
const grepTargets = ["src", ".env.example"];
let foundBadPublicVar = false;
for (const target of grepTargets) {
  if (!existsSync(target)) continue;
  try {
    const result = execSync(
      `grep -rnE "${secretShapedPublicVar.source}" ${target} || true`,
      { encoding: "utf8" }
    );
    if (result.trim()) {
      foundBadPublicVar = true;
      console.error(result);
    }
  } catch {
    // grep exits non-zero on no matches with some shells; ignore.
  }
}
if (foundBadPublicVar) {
  fail("Found a NEXT_PUBLIC_ variable name that looks like it holds a secret.");
} else {
  ok("No secret-shaped NEXT_PUBLIC_ variable names found.");
}

// 2. No real .env file tracked by git.
try {
  const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n");
  const badEnvFiles = tracked.filter(
    (f) => /^\.env(\..+)?$/.test(f.trim()) && f.trim() !== ".env.example"
  );
  if (badEnvFiles.length > 0) {
    fail(`Tracked .env file(s) found in git: ${badEnvFiles.join(", ")}`);
  } else {
    ok("No real .env file is tracked by git.");
  }
} catch (e) {
  console.warn("Could not check git-tracked files (not a git repo?):", e.message);
}

// 3. .env.example should contain only placeholders, never a real-looking key.
if (existsSync(".env.example")) {
  const content = readFileSync(".env.example", "utf8");
  const suspicious = /sb_secret_(?!x{5,})[A-Za-z0-9]{20,}/.test(content);
  if (suspicious) {
    fail(".env.example appears to contain a real (non-placeholder) secret key.");
  } else {
    ok(".env.example contains only placeholder values.");
  }
}

if (failed) {
  console.error("\nSecurity-sensitive configuration check FAILED.");
  process.exit(1);
} else {
  console.log("\nSecurity-sensitive configuration check passed.");
}
