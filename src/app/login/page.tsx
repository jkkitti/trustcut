import { redirect } from "next/navigation";
import { LoginPage } from "@/components/login-page";
import { createSupabaseServerClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function Login() {
  const supabaseConfigured = hasSupabaseServerEnv();

  if (supabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/");
    }
  }

  return <LoginPage supabaseConfigured={supabaseConfigured} />;
}
