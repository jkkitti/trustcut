"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/browser";
import type { AuthIdentity } from "@/lib/types";
import { cn } from "@/lib/utils";

type AuthPanelProps = {
  language: Language;
  initialIdentity: AuthIdentity | null;
  pdpaAccepted: boolean;
  onAuthenticatedChange: (authenticated: boolean) => void;
  onPdpaChange: (accepted: boolean) => void;
};

export function AuthPanel({
  language,
  initialIdentity,
  pdpaAccepted,
  onAuthenticatedChange,
  onPdpaChange,
}: AuthPanelProps) {
  const t = translations[language];
  const configured = isSupabaseBrowserConfigured();
  const [identity, setIdentity] = useState<AuthIdentity | null>(initialIdentity);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const nextIdentity = data.session?.user ? identityFromUser(data.session.user) : null;
      setIdentity(nextIdentity);
      onAuthenticatedChange(Boolean(nextIdentity));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextIdentity = nextSession?.user ? identityFromUser(nextSession.user) : null;
      setIdentity(nextIdentity);
      onAuthenticatedChange(Boolean(nextIdentity));
    });

    return () => subscription.unsubscribe();
  }, [configured, initialIdentity, onAuthenticatedChange]);

  async function signInWithGoogle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !pdpaAccepted) {
      return;
    }

    setBusy(true);
    setNotice("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setNotice(error.message);
      setBusy(false);
    }
  }

  async function signInWithEmail() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email || !pdpaAccepted) {
      return;
    }

    setBusy(true);
    setNotice("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setBusy(false);
    setNotice(error ? error.message : t.magicLinkSent);
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setIdentity(null);
    onAuthenticatedChange(false);
  }

  return (
    <section className="border border-[#dbe3df] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#18211f]">{t.ownerAccess}</p>
          <p className="mt-1 text-xs leading-5 text-[#6c7772]">
            {identity?.email || identity?.name || (configured ? t.authSignInHelp : t.authDemoMode)}
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 text-[#158f7a]" aria-hidden />
      </div>

      <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-[#33413d]">
        <input
          type="checkbox"
          checked={pdpaAccepted}
          onChange={(event) => onPdpaChange(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[#158f7a]"
        />
        <span>{t.authConsent}</span>
      </label>

      {configured && !identity && (
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={!pdpaAccepted || busy}
            className={buttonClass(!pdpaAccepted || busy)}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {t.continueWithGoogle}
          </button>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@salon.com"
              className="min-w-0 flex-1 border border-[#cfd9d4] px-3 py-2 text-sm outline-none transition focus:border-[#158f7a]"
            />
            <button
              type="button"
              onClick={signInWithEmail}
              disabled={!pdpaAccepted || busy || !email}
              className={cn(buttonClass(!pdpaAccepted || busy || !email), "w-11 justify-center px-0")}
              aria-label={t.sendEmailLoginLink}
              title={t.sendEmailLoginLink}
            >
              <Mail className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {identity && (
        <button type="button" onClick={signOut} className={cn(buttonClass(false), "mt-4")}>
          <LogOut className="h-4 w-4" aria-hidden />
          {t.signOut}
        </button>
      )}

      {(notice || !configured) && (
        <p className="mt-3 text-xs leading-5 text-[#8a5b16]">
          {notice || t.authDemoNotice}
        </p>
      )}
    </section>
  );
}

function identityFromUser(user: {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
}): AuthIdentity {
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

function buttonClass(disabled: boolean) {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 border px-3 text-sm font-semibold transition",
    disabled
      ? "cursor-not-allowed border-[#d5ddd9] bg-[#eef3f1] text-[#8a9691]"
      : "border-[#18211f] bg-[#18211f] text-white hover:bg-[#293631]",
  );
}
