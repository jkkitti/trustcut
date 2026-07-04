import type { ScorePoint } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function maskTrustCutId(id: string) {
  if (id.length <= 6) {
    return id.replace(/\d(?=\d{2})/g, "*");
  }

  const prefix = id.slice(0, 3);
  const suffix = id.slice(-3);
  return `${prefix}${"*".repeat(Math.max(4, id.length - 6))}${suffix}`;
}

export function averageScore(points: ScorePoint[]) {
  if (!points.length) {
    return 0;
  }

  return Math.round(points.reduce((sum, point) => sum + point.score, 0) / points.length);
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}
