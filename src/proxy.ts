import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseKey, getPublicSupabaseUrl } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase session cookie on every request. This is the
 * standard @supabase/ssr middleware pattern — it does not itself gate
 * access to any route; page-level Server Components decide what to do
 * with an authenticated vs. anonymous session.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getPublicSupabaseUrl(), getPublicSupabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js).*)",
  ],
};
