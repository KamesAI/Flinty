export const WARMUP_DURATION_DAYS = 14;
export const WARMUP_MIN_DAILY_SENDS = 5;
export const WARMUP_MAX_DAILY_SENDS = 20;

export interface WarmupState {
  enabled: boolean;
  day: number;
  maxDailySends: number;
  positiveReplies: number;
  completed: boolean;
}

export function configBool(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return value.trim().toLowerCase() === "true";
}

export function getWarmupDay(startedAt: string | undefined, now: Date = new Date()): number {
  if (!startedAt) return 1;
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return 1;
  const elapsedDays = Math.floor((now.getTime() - started) / 86_400_000) + 1;
  return Math.max(1, elapsedDays);
}

export function getWarmupDailyCap(day: number): number {
  if (day <= 1) return WARMUP_MIN_DAILY_SENDS;
  if (day >= WARMUP_DURATION_DAYS) return WARMUP_MAX_DAILY_SENDS;

  const progress = (day - 1) / (WARMUP_DURATION_DAYS - 1);
  return Math.round(
    WARMUP_MIN_DAILY_SENDS +
      progress * (WARMUP_MAX_DAILY_SENDS - WARMUP_MIN_DAILY_SENDS)
  );
}

export function countWarmupPositiveRepliesFromTurns(
  turns: Array<{ tags?: string }>
): number {
  return turns.filter((turn) =>
    (turn.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .includes("warmup_positive_reply")
  ).length;
}

export function buildWarmupState(
  config: Record<string, string>,
  positiveReplies: number,
  now: Date = new Date()
): WarmupState {
  const enabled = configBool(config.warmup_campaign, false);
  const day = getWarmupDay(config.warmup_started_at, now);
  return {
    enabled,
    day,
    maxDailySends: enabled ? getWarmupDailyCap(day) : WARMUP_MAX_DAILY_SENDS,
    positiveReplies,
    completed: enabled && day >= WARMUP_DURATION_DAYS,
  };
}
