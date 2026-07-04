import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  hasSupabaseServerEnv,
} from "@/lib/supabase/server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code && hasSupabaseServerEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensureProfile(user);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

async function ensureProfile(user: {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin.from("profiles").select("id").eq("id", user.id).maybeSingle();

  if (data) {
    return;
  }

  const displayName =
    typeof user.user_metadata.name === "string"
      ? user.user_metadata.name
      : typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : user.email || "New TrustCut member";

  await supabaseAdmin.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    role: "owner",
    status: "pending",
  });
}
