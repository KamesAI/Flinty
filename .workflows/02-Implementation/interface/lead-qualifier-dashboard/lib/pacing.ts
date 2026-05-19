import type { PacingCheckResult } from "./types";
import type { LIAccountStatus } from "./unipile";

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

// ——— LinkedIn pacing ———

export const LI_CAP_WEEKLY = 100;
export const LI_CAP_DAILY_MAX = 20;

export const LI_CAPS = {
  WEEKLY_HARD: 100,
  DAILY_WARM: { invitations: 20, dms: 50, views: 200, removals: 50 },
  DAILY_NEW: { invitations: 5, dms: 20, views: 50, removals: 10 },
} as const;

export const NOTE_RATIO = { with_note: 0.6, without_note: 0.4 } as const;

const LI_RAMP_DAILY = [5, 10, 15, 20] as const;

const LI_ACTIVE_STATUSES: LIAccountStatus[] = ["OK"];

/** Cap journalier LinkedIn selon semaine de ramp-up (0-indexed). */
export function getLIRampUpCap(weekIndex: number): number {
  const idx = Math.min(weekIndex, LI_RAMP_DAILY.length - 1);
  return LI_RAMP_DAILY[idx];
}

/**
 * Vérifie si le compte LinkedIn peut envoyer une invitation maintenant.
 * Cap hebdomadaire 100 est HARD — non-overridable.
 *
 * @param accountStatus — statut Unipile du compte LI
 * @param sentToday — invitations envoyées aujourd'hui
 * @param sentThisWeek — invitations envoyées cette semaine (lun–dim)
 * @param weekIndex — semaine depuis le début du ramp-up (0-indexed)
 * @param capDailyOverride — cap journalier custom (défaut: ramp-up par semaine)
 */
export function checkLIHealth(
  accountStatus: LIAccountStatus,
  sentToday: number,
  sentThisWeek: number,
  weekIndex: number,
  capDailyOverride?: number
): PacingCheckResult {
  if (!LI_ACTIVE_STATUSES.includes(accountStatus)) {
    return { allowed: false, reason: "li_account_paused" };
  }

  if (sentThisWeek >= LI_CAP_WEEKLY) {
    return { allowed: false, reason: "cap_weekly_li" };
  }

  const capDaily = capDailyOverride ?? getLIRampUpCap(weekIndex);
  if (sentToday >= capDaily) {
    return { allowed: false, reason: "cap_daily_li" };
  }

  return { allowed: true };
}

/** Gauss typing delay LI : µ=5s σ=2s, minimum 2s. */
export function sampleLITypingDelay(): number {
  return Math.max(2, sampleGaussDelay(5, 2));
}

/**
 * 60% des invitations incluent une note personnalisée, 40% sans.
 * Basé sur le compteur journalier pour une distribution stable.
 */
export function shouldIncludeNote(sentTodayIndex: number): boolean {
  return (sentTodayIndex % 10) < 6;
}

/** Alias shouldIncludeNote — nom task v4-024. */
export const shouldAddNote = shouldIncludeNote;

/**
 * Délai Gauss avant action LI, en ms.
 * invitation: µ=360s σ=144s · dm: µ=240s σ=96s · reply: µ=60s σ=24s
 */
export function nextLIDelayMs(action: "invitation" | "dm" | "reply"): number {
  const MU_S = { invitation: 360, dm: 240, reply: 60 } as const;
  const mu = MU_S[action];
  const sigma = mu * 0.4;
  return sampleGaussDelay(mu, sigma) * 1000;
}

/** Retourne false si le cap hebdomadaire LinkedIn (100 HARD) est atteint. */
export function checkLIWeeklyCap(invitsSentThisWeek: number): boolean {
  return invitsSentThisWeek < LI_CAPS.WEEKLY_HARD;
}

/**
 * Cap journalier invitations selon semaine de ramp-up, à partir de la date
 * de création du compte (identique à getLIRampUpCap mais accepte une Date).
 */
export function getRampUpLimit(
  accountCreatedAt: Date,
  action: "invitation"
): number {
  void action; // seule invitation supportée — signature extensible
  const weeksSince = Math.floor(
    (Date.now() - accountCreatedAt.getTime()) / (7 * 86_400_000)
  );
  return getLIRampUpCap(weeksSince);
}

/**
 * Vérifie si l'action LI peut encore être faite aujourd'hui.
 * Distingue compte "new" (<4 sem) et "warm" (≥4 sem) pour dms/views/removals.
 * Pour invitations : utilise toujours le ramp-up.
 */
export function checkLIDailyCap(
  action: "invitation" | "dm" | "view" | "removal",
  sentToday: number,
  accountCreatedAt: Date
): boolean {
  const weeksSince = Math.floor(
    (Date.now() - accountCreatedAt.getTime()) / (7 * 86_400_000)
  );

  if (action === "invitation") {
    return sentToday < getLIRampUpCap(weeksSince);
  }

  const isNew = weeksSince < 4;
  const caps = isNew ? LI_CAPS.DAILY_NEW : LI_CAPS.DAILY_WARM;
  const capMap: Record<string, number> = {
    dm: caps.dms,
    view: caps.views,
    removal: caps.removals,
  };
  return sentToday < (capMap[action] ?? 0);
}

/**
 * Durée de frappe simulée pour un texte donné.
 * µ=35wpm σ=10wpm Gauss, minimum 2000ms.
 */
export function typingDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const wpm = sampleGaussDelay(35, 10); // clamp ≥30 de sampleGaussDelay
  const ms = Math.round((words / wpm) * 60_000);
  return Math.max(2000, ms);
}

// ——— Email health status ———

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
