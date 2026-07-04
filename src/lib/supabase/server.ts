import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";

export function hasSupabaseServerEnv() {
  return hasSupabasePublicEnv();
}

export async function createSupabaseServerClient() {
  if (!hasSupabaseServerEnv()) {
    throw new Error("Supabase URL and anon key are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Components cannot always mutate cookies; src/proxy.ts refreshes them.
            }
          });
        },
      },
    },
  );
}
