import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseUrl } from "./env";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * This must NEVER be imported from any file reachable by client
 * components, and the `server-only` import above makes any accidental
 * client-bundle import a build-time error rather than a leaked secret.
 *
 * Only import this inside Route Handlers / Server Actions that need to
 * perform trusted, authoritative writes: XP, leveling, evolution, stat
 * decay, game validation. Every one of those write paths independently
 * re-checks that the acting user owns the target avatar before writing,
 * even though the service role itself has no RLS restriction — the
 * authorization check has to happen in application code once you hold a
 * service-role client.
 */
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseAdminClient() {
  if (cached) return cached;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing required environment variable: SUPABASE_SECRET_KEY");
  }
  cached = createClient<Database>(getPublicSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
