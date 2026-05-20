import { describe, expect, it } from "vitest";
import {
  computeAcceptRate,
  evaluateLinkedInHealth,
  isLinkedInAcceptRateWarning,
} from "./li-health";

const CHECKED_AT = "2026-05-20T10:00:00.000Z";

describe("evaluateLinkedInHealth", () => {
  it("met en pause sur captcha simulé", () => {
    const result = evaluateLinkedInHealth({
      accountStatus: "OK",
      invitationsSent7d: 8,
      invitationsAccepted7d: 4,
      captchaDetected: true,
      checkedAt: CHECKED_AT,
    });

    expect(result.status).toBe("paused_captcha");
    expect(result.pause_started_at).toBe(CHECKED_AT);
    expect(result.shouldPause).toBe(true);
  });

  it("met en pause si accept_rate <20% avec au moins 10 invitations", () => {
    const result = evaluateLinkedInHealth({
      accountStatus: "OK",
      invitationsSent7d: 12,
      invitationsAccepted7d: 2,
      checkedAt: CHECKED_AT,
    });

    expect(result.status).toBe("paused_low_accept");
    expect(result.acceptance_rate_7d).toBe("0.167");
    expect(result.shouldPause).toBe(true);
  });

  it("ne pause pas si accept_rate 20-35%, mais expose un warning", () => {
    const result = evaluateLinkedInHealth({
      accountStatus: "OK",
      invitationsSent7d: 20,
      invitationsAccepted7d: 6,
      checkedAt: CHECKED_AT,
    });

    expect(result.status).toBe("active");
    expect(result.reason).toContain("Warning");
    expect(result.shouldPause).toBe(false);
  });

  it("met en pause sur mode Suivre détecté sur au moins 3 profils", () => {
    const result = evaluateLinkedInHealth({
      accountStatus: "OK",
      invitationsSent7d: 6,
      invitationsAccepted7d: 3,
      followModeProfiles: 3,
      checkedAt: CHECKED_AT,
    });

    expect(result.status).toBe("paused_follow_mode");
  });
});

describe("computeAcceptRate", () => {
  it("retourne 0 si aucune invitation envoyée", () => {
    expect(computeAcceptRate(0, 0)).toBe(0);
  });
});

describe("isLinkedInAcceptRateWarning", () => {
  it("cible uniquement la zone 20-35%", () => {
    expect(isLinkedInAcceptRateWarning(0.19)).toBe(false);
    expect(isLinkedInAcceptRateWarning(0.2)).toBe(true);
    expect(isLinkedInAcceptRateWarning(0.34)).toBe(true);
    expect(isLinkedInAcceptRateWarning(0.35)).toBe(false);
  });
});
