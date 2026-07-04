"use client";

import { useState } from "react";
import { Crosshair, MapPinCheck, MapPinOff, Navigation } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type GeoState = "idle" | "checking" | "verified" | "denied" | "error";

type GeoVerificationProps = {
  language: Language;
  onVerifiedChange: (verified: boolean) => void;
};

type GeoResponse = {
  authorized: boolean;
  demoMode: boolean;
  message: string;
  nearest?: {
    name: string;
    distanceMeters: number;
    radiusMeters: number;
  };
};

export function GeoVerification({ language, onVerifiedChange }: GeoVerificationProps) {
  const t = translations[language];
  const [state, setState] = useState<GeoState>("idle");
  const [response, setResponse] = useState<GeoResponse | null>(null);

  function verifyGps() {
    if (!("geolocation" in navigator)) {
      setState("error");
      onVerifiedChange(false);
      setResponse({
        authorized: false,
        demoMode: false,
        message: t.gpsNoSupport,
      });
      return;
    }

    setState("checking");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const apiResponse = await fetch("/api/geo/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        });
        const data = (await apiResponse.json()) as GeoResponse;
        setResponse(data);
        setState(data.authorized ? "verified" : "denied");
        onVerifiedChange(data.authorized);
      },
      (error) => {
        setState("error");
        onVerifiedChange(false);
        setResponse({
          authorized: false,
          demoMode: false,
          message: error.message || t.gpsPermissionDenied,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 60_000,
      },
    );
  }

  const verified = state === "verified";
  const denied = state === "denied" || state === "error";
  const responseMessage = response
    ? state === "error"
      ? response.message
      : response.demoMode && response.authorized
        ? t.gpsDemoVerified
        : response.authorized
          ? t.gpsAuthorized
          : t.gpsUnauthorized
    : t.gpsDefaultHelp;

  return (
    <section className="border border-[#dbe3df] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#18211f]">{t.gpsAuthorization}</p>
          <p className="mt-1 text-xs leading-5 text-[#6c7772]">
            {responseMessage}
          </p>
        </div>
        {verified ? (
          <MapPinCheck className="h-5 w-5 text-[#158f7a]" aria-hidden />
        ) : denied ? (
          <MapPinOff className="h-5 w-5 text-[#c44e35]" aria-hidden />
        ) : (
          <Crosshair className="h-5 w-5 text-[#6c7772]" aria-hidden />
        )}
      </div>

      {response?.nearest && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#33413d]">
          <span className="border border-[#e2e8e5] px-2 py-1">{response.nearest.name}</span>
          <span className="border border-[#e2e8e5] px-2 py-1">
            {Math.round(response.nearest.distanceMeters / 1000)} {language === "th" ? "กม." : "km away"}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={verifyGps}
        disabled={state === "checking"}
        className={cn(
          "mt-4 inline-flex h-10 w-full items-center justify-center gap-2 border px-3 text-sm font-semibold transition",
          verified
            ? "border-[#158f7a] bg-[#e6f6f1] text-[#0f6c5d]"
            : "border-[#18211f] bg-white text-[#18211f] hover:bg-[#eef3f1]",
          state === "checking" && "cursor-wait opacity-70",
        )}
      >
        <Navigation className="h-4 w-4" aria-hidden />
        {state === "checking" ? t.checking : verified ? t.verified : t.verifyGps}
      </button>
    </section>
  );
}
