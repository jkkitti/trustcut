import { TrustCutApp } from "@/components/trustcut-app";
import { adminSeed, hairdressers } from "@/lib/sample-data";
import { createSupabaseServerClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import type { AuthIdentity } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function Home() {
  const initialIdentity = await getInitialIdentity();

  if (hasSupabaseServerEnv() && !initialIdentity) {
    redirect("/login");
  }

  return (
    <TrustCutApp
      initialHairdressers={hairdressers}
      adminSeed={adminSeed}
      initialIdentity={initialIdentity}
    />
  );
}

async function getInitialIdentity(): Promise<AuthIdentity | null> {
  if (!hasSupabaseServerEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    name:
      typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : null,
    avatarUrl:
      typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    provider: user.app_metadata.provider ? String(user.app_metadata.provider) : null,
  };
}
