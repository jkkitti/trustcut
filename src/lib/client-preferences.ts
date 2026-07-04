export const PDPA_CONSENT_STORAGE_KEY = "trustcut:pdpa-consent-accepted";
export const THEME_STORAGE_KEY = "trustcut:theme";

export type ThemeMode = "light" | "dark";

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}
