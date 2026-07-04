"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Moon, ShieldCheck, Sun } from "lucide-react";
import { TrustCutLogo } from "@/components/trustcut-logo";
import {
  isThemeMode,
  PDPA_CONSENT_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/client-preferences";
import type { Language, Translation } from "@/lib/i18n";
import { languageOptions, translations } from "@/lib/i18n";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type LoginPageProps = {
  supabaseConfigured: boolean;
};

export function LoginPage({ supabaseConfigured }: LoginPageProps) {
  const [language, setLanguage] = useState<Language>("th");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [pdpaAccepted, setPdpaAccepted] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = supabaseConfigured && isSupabaseBrowserConfigured();
  const t = translations[language];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPdpaAccepted(window.localStorage.getItem(PDPA_CONSENT_STORAGE_KEY) === "true");
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeMode(storedTheme)) {
        setTheme(storedTheme);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function updatePdpaConsent(accepted: boolean) {
    setPdpaAccepted(accepted);
    window.localStorage.setItem(PDPA_CONSENT_STORAGE_KEY, accepted ? "true" : "false");
  }

  function updateTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  async function signInWithGoogle() {
    if (!pdpaAccepted) {
      setNotice(t.loginPdpaRequired);
      return;
    }

    if (!configured) {
      document.cookie = "trustcut-demo-access=true; path=/; max-age=86400; SameSite=Lax";
      window.location.assign("/");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice(t.authDemoNotice);
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
      setBusy(false);
      setNotice(error.message);
    }
  }

  return (
    <div data-theme={theme} className="flex min-h-screen flex-col bg-[#f5f7f4] text-[#18211f]">
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-4 py-8 lg:grid-cols-[1fr_420px] lg:px-6">
        <section className="border border-[#dbe3df] bg-white p-5 shadow-sm md:p-7">
          <TrustCutLogo />
          <div className="mt-8 inline-flex items-center gap-2 border border-[#cfe8df] bg-[#e9f7f2] px-3 py-1.5 text-xs font-semibold text-[#0f6c5d]">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t.loginBadge}
          </div>
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-normal text-[#18211f] md:text-5xl">
            {t.loginTitle}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f6b66] md:text-base">
            {t.loginSubtitle}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <LoginSignal label={t.googleOauth} />
            <LoginSignal label={t.pdpaConsent} />
            <LoginSignal label={t.gpsAuthorization} />
          </div>
        </section>

        <section className="border border-[#dbe3df] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-[#18211f]">{t.loginPanelTitle}</p>
              <p className="mt-2 text-sm leading-6 text-[#6c7772]">{t.loginPanelHelp}</p>
            </div>
            <LockKeyhole className="h-5 w-5 text-[#158f7a]" aria-hidden />
          </div>

          <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-[#33413d]">
            <input
              type="checkbox"
              checked={pdpaAccepted}
              onChange={(event) => updatePdpaConsent(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#158f7a]"
            />
            <span>{t.authConsent}</span>
          </label>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy || !pdpaAccepted}
            className={cn(
              "mt-6 inline-flex h-12 w-full items-center justify-center gap-3 border px-4 text-sm font-semibold transition",
              busy || !pdpaAccepted
                ? "cursor-not-allowed border-[#d5ddd9] bg-[#eef3f1] text-[#8a9691]"
                : "border-[#18211f] bg-[#18211f] text-white hover:bg-[#293631]",
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#18211f]">
              G
            </span>
            {configured ? t.continueWithGoogle : t.continueDemo}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>

          {(notice || !configured) && (
            <p className="mt-4 text-xs leading-5 text-[#8a5b16]">
              {notice || t.loginDemoHelp}
            </p>
          )}
        </section>
      </main>

      <LoginLanguageFooter
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={updateTheme}
        t={t}
      />
    </div>
  );
}

function LoginSignal({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border border-[#e2e8e5] bg-[#fbfcfb] px-3 py-2 text-sm font-semibold text-[#33413d]">
      <Check className="h-4 w-4 text-[#158f7a]" aria-hidden />
      {label}
    </div>
  );
}

function LoginLanguageFooter({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  t,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  t: Translation;
}) {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-8 lg:px-6">
      <div className="grid gap-4 border border-[#dbe3df] bg-white p-4 shadow-sm md:grid-cols-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#18211f]">{t.languageTitle}</p>
            <p className="mt-1 text-xs leading-5 text-[#6c7772]">{t.languageHelp}</p>
          </div>
          <div className="inline-grid grid-cols-2 gap-1 border border-[#dbe3df] bg-[#f5f7f4] p-1">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => onLanguageChange(option.code)}
                className={cn(
                  "h-10 px-4 text-sm font-semibold transition",
                  language === option.code
                    ? "bg-[#18211f] text-white"
                    : "bg-transparent text-[#33413d] hover:bg-white",
                )}
                aria-pressed={language === option.code}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#18211f]">{t.themeTitle}</p>
            <p className="mt-1 text-xs leading-5 text-[#6c7772]">{t.themeHelp}</p>
          </div>
          <div className="inline-grid grid-cols-2 gap-1 border border-[#dbe3df] bg-[#f5f7f4] p-1">
            <button
              type="button"
              onClick={() => onThemeChange("light")}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold transition",
                theme === "light"
                  ? "bg-[#18211f] text-white"
                  : "bg-transparent text-[#33413d] hover:bg-white",
              )}
              aria-pressed={theme === "light"}
            >
              <Sun className="h-4 w-4" aria-hidden />
              {t.themeLight}
            </button>
            <button
              type="button"
              onClick={() => onThemeChange("dark")}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold transition",
                theme === "dark"
                  ? "bg-[#18211f] text-white"
                  : "bg-transparent text-[#33413d] hover:bg-white",
              )}
              aria-pressed={theme === "dark"}
            >
              <Moon className="h-4 w-4" aria-hidden />
              {t.themeDark}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
