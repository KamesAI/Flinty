import type { LIAccountStatus } from "./unipile";

export type LinkedInHealthStatus =
  | "active"
  | "paused_captcha"
  | "paused_warning"
  | "paused_low_accept"
  | "paused_follow_mode";

export interface LinkedInHealthInput {
  accountStatus: LIAccountStatus;
  invitationsSent7d: number;
  invitationsAccepted7d: number;
  captchaDetected?: boolean;
  warningDetected?: boolean;
  followModeProfiles?: number;
  checkedAt?: string;
}

export interface LinkedInHealthDecision {
  status: LinkedInHealthStatus;
  reason: string;
  acceptance_rate_7d: string;
  pause_started_at: string;
  last_check_at: string;
  shouldPause: boolean;
}

export function computeAcceptRate(accepted: number, sent: number): number {
  if (sent <= 0) return 0;
  return accepted / sent;
}

export function evaluateLinkedInHealth(input: LinkedInHealthInput): LinkedInHealthDecision {
  const now = input.checkedAt ?? new Date().toISOString();
  const acceptRate = computeAcceptRate(input.invitationsAccepted7d, input.invitationsSent7d);
  const base = {
    acceptance_rate_7d: acceptRate.toFixed(3),
    pause_started_at: "",
    last_check_at: now,
  };

  if (input.captchaDetected || input.accountStatus === "ACTION_NEEDED") {
    return {
      ...base,
      status: "paused_captcha",
      reason: "Captcha LinkedIn détecté",
      pause_started_at: now,
      shouldPause: true,
    };
  }

  if (input.warningDetected || input.accountStatus === "RECONNECT") {
    return {
      ...base,
      status: "paused_warning",
      reason: "Alerte LinkedIn activité inhabituelle détectée",
      pause_started_at: now,
      shouldPause: true,
    };
  }

  if (input.accountStatus !== "OK") {
    return {
      ...base,
      status: "paused_warning",
      reason: `Statut compte Unipile ${input.accountStatus}`,
      pause_started_at: now,
      shouldPause: true,
    };
  }

  if (input.invitationsSent7d >= 10 && acceptRate < 0.2) {
    return {
      ...base,
      status: "paused_low_accept",
      reason: "Taux d'acceptation LinkedIn <20% sur 7 jours",
      pause_started_at: now,
      shouldPause: true,
    };
  }

  if ((input.followModeProfiles ?? 0) >= 3) {
    return {
      ...base,
      status: "paused_follow_mode",
      reason: "Mode Suivre détecté sur plusieurs profils",
      pause_started_at: now,
      shouldPause: true,
    };
  }

  return {
    ...base,
    status: "active",
    reason: acceptRate >= 0.2 && acceptRate < 0.35
      ? "Warning: taux d'acceptation LinkedIn entre 20% et 35%"
      : "",
    shouldPause: false,
  };
}

export function isLinkedInAcceptRateWarning(rate: number): boolean {
  return rate >= 0.2 && rate < 0.35;
}
