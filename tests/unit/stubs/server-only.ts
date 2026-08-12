// Test-only stub for the `server-only` package. In real Next.js builds,
// Next's bundler makes this module throw when pulled into a client
// bundle (that's the whole point of the package) and is a no-op on the
// server. Vitest has no such client/server bundle split, so importing
// the real package would always throw; we alias it to this no-op stub
// (see vitest.config.ts) purely so server-only utility functions can be
// unit tested directly.
export {};
