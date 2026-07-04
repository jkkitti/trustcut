"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient<Database> | null = null;

export function isSupabaseBrowserConfigured() {
  return hasSupabasePublicEnv();
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseBrowserConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
    );
  }

  return browserClient;
}
