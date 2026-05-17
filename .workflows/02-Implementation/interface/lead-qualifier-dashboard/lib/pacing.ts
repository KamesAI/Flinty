import type { PacingCheckResult } from "./types";

// ——— Constants ———

export const EMAIL_HEALTH_SHEET_NAME = "Email_Health";

export const EMAIL_HEALTH_HEADER = [
  "domain",
  "sent_today",
  "bounce_rate_7d",
  "complaint_rate_7d",
  "last_mail_tester_score",
  "last_check_at",
  "status",
] as const;

export const BOUNCE_RATE_THRESHOLD = 0.05;
export const COMPLAINT_RATE_THRESHOLD = 0.003;
export const EMAIL_CAP_HOURLY = 50;

// Email ramp-up: 5 → 10 → 15 → 20 emails/jour sur 4 semaines
const EMAIL_RAMP_DAILY = [5, 10, 15, 20] as const;

// ——— Types ———

export interface EmailHealthRow {
  domain: string;
  sent_today: string;
  bounce_rate_7d: string;
  complaint_rate_7d: string;
  last_mail_tester_score: string;
  last_check_at: string;
  status: "active" | "paused_high_bounce" | "paused_high_complaint";
}

// ——— Helpers ———

/**
 * Box-Muller transform → sample from Gaussian(µ, σ).
 * Clamp à 30s minimum.
 */
export function sampleGaussDelay(mu: number, sigma: number): number {
  if (sigma === 0) return Math.max(30, mu);
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 === 0 ? 1e-10 : u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(30, Math.round(mu + sigma * z));
}

/** Gauss delay email: µ=8min σ=3min → secondes. */
export function sampleEmailDelay(): number {
  return sampleGaussDelay(480, 180);
}

/**
 * Returns true si l'heure courante est dans les heures ouvrées (9h–19h, lun–ven, Paris CEST/CET).
 */
export function isWithinHumanHours(now: Date = new Date()): boolean {
  const parisFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    weekday: "short",
    hour12: false,
  });
  const parts = parisFmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);

  const isWeekday = !["Sat", "Sun"].includes(weekday);
  return isWeekday && hour >= 9 && hour < 19;
}

/** Cap journalier email selon semaine de ramp-up (0-indexed). */
export function getEmailRampUpCap(weekIndex: number): number {
  const idx = Math.min(weekIndex, EMAIL_RAMP_DAILY.length - 1);
  return EMAIL_RAMP_DAILY[idx];
}

// ——— Email Health ———

export function parseEmailHealthRows(rows: string[][]): EmailHealthRow[] {
  if (rows.length <= 1) return [];
  const [, ...data] = rows;
  return data
    .filter((row) => (row[0] ?? "").trim().length > 0)
    .map((row) => ({
      domain: row[0] ?? "",
      sent_today: row[1] ?? "0",
      bounce_rate_7d: row[2] ?? "0",
      complaint_rate_7d: row[3] ?? "0",
      last_mail_tester_score: row[4] ?? "0",
      last_check_at: row[5] ?? "",
      status: ((row[6] ?? "active") as EmailHealthRow["status"]) || "active",
    }));
}

export function formatEmailHealthRow(row: EmailHealthRow): string[] {
  return [
    row.domain,
    row.sent_today,
    row.bounce_rate_7d,
    row.complaint_rate_7d,
    row.last_mail_tester_score,
    row.last_check_at,
    row.status,
  ];
}

/**
 * Vérifie si un domaine peut envoyer un email maintenant.
 * @param health — ligne Email_Health pour ce domaine (null si domaine inconnu)
 * @param sentThisHour — emails envoyés dans la dernière heure
 * @param capHourly — cap horaire (défaut: EMAIL_CAP_HOURLY)
 */
export function checkEmailHealth(
  domain: string,
  health: EmailHealthRow | null,
  sentThisHour: number,
  capHourly: number = EMAIL_CAP_HOURLY
): PacingCheckResult {
  if (!health) {
    return { allowed: false, reason: "domain_not_found" };
  }

  if (health.status === "paused_high_bounce") {
    return { allowed: false, reason: "paused_high_bounce" };
  }

  if (health.status === "paused_high_complaint") {
    return { allowed: false, reason: "paused_high_complaint" };
  }

  if (sentThisHour >= capHourly) {
    return { allowed: false, reason: "cap_hourly" };
  }

  return { allowed: true };
}

/**
 * Calcule le nouveau status Email_Health basé sur les taux.
 */
export function computeEmailHealthStatus(
  bounceRate: number,
  complaintRate: number
): EmailHealthRow["status"] {
  if (bounceRate > BOUNCE_RATE_THRESHOLD) return "paused_high_bounce";
  if (complaintRate > COMPLAINT_RATE_THRESHOLD) return "paused_high_complaint";
  return "active";
}
