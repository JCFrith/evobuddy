"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseKey, getPublicSupabaseUrl } from "./env";
import type { Database } from "@/types/database";

/** Browser Supabase client. Only ever uses the public publishable key. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(getPublicSupabaseUrl(), getPublicSupabaseKey(), {
    db: { schema: "evobuddy" },
  });
}
