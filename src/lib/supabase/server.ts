import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseKey, getPublicSupabaseUrl } from "./env";
import type { Database } from "@/types/database";

/**
 * RLS-scoped Supabase client bound to the current request's session
 * cookie. Use this for every read/write that should be constrained by the
 * signed-in user's own row (Row Level Security enforces the boundary at
 * the database layer too, so this is defense in depth, not the only
 * layer).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(getPublicSupabaseUrl(), getPublicSupabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` is called from a Server Component in some render
          // paths, where cookie mutation isn't allowed. Session refresh
          // there is a no-op; middleware handles the actual refresh.
        }
      },
    },
  });
}
