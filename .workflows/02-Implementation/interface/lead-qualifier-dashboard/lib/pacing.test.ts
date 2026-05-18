import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isWithinHumanHours,
  sampleGaussDelay,
  getEmailRampUpCap,
  checkEmailHealth,
  parseEmailHealthRows,
  formatEmailHealthRow,
  EMAIL_HEALTH_HEADER,
  EMAIL_HEALTH_SHEET_NAME,
  getLIRampUpCap,
  checkLIHealth,
  sampleLITypingDelay,
  shouldIncludeNote,
  LI_CAP_WEEKLY,
  LI_CAP_DAILY_MAX,
  type EmailHealthRow,
} from "./pacing";

describe("isWithinHumanHours", () => {
  it("accepte 10h un lundi", () => {
    // 2026-05-11 = lundi 10:00 Paris (UTC+2 en mai = CEST)
    const date = new Date("2026-05-11T08:00:00.000Z"); // 10:00 Paris CEST
    expect(isWithinHumanHours(date)).toBe(true);
  });

  it("refuse 8h (avant 9h)", () => {
    const date = new Date("2026-05-11T06:00:00.000Z"); // 8:00 Paris CEST
    expect(isWithinHumanHours(date)).toBe(false);
  });

  it("refuse 20h (après 19h)", () => {
    const date = new Date("2026-05-11T18:00:00.000Z"); // 20:00 Paris CEST
    expect(isWithinHumanHours(date)).toBe(false);
  });

  it("refuse samedi", () => {
    const date = new Date("2026-05-09T09:00:00.000Z"); // samedi 11:00 Paris CEST
    expect(isWithinHumanHours(date)).toBe(false);
  });

  it("refuse dimanche", () => {
    const date = new Date("2026-05-10T09:00:00.000Z"); // dimanche 11:00 Paris CEST
    expect(isWithinHumanHours(date)).toBe(false);
  });
});

describe("sampleGaussDelay", () => {
  it("retourne un nombre positif", () => {
    const delay = sampleGaussDelay(480, 180);
    expect(delay).toBeGreaterThan(0);
  });

  it("reste dans une plage raisonnable (4 sigma)", () => {
    for (let i = 0; i < 100; i++) {
      const delay = sampleGaussDelay(480, 180);
      // P(|X - µ| > 4σ) ≈ 0.006% — tolérance large
      expect(delay).toBeGreaterThan(480 - 4 * 180);
    }
  });

  it("clamp à min 30s", () => {
    // µ=0 σ=0 → always 0, but clamp to 30
    const delay = sampleGaussDelay(0, 0);
    expect(delay).toBeGreaterThanOrEqual(30);
  });
});

describe("getEmailRampUpCap", () => {
  it("sem 0 → 5 emails/jour", () => {
    expect(getEmailRampUpCap(0)).toBe(5);
  });

  it("sem 1 → 10 emails/jour", () => {
    expect(getEmailRampUpCap(1)).toBe(10);
  });

  it("sem 2 → 15 emails/jour", () => {
    expect(getEmailRampUpCap(2)).toBe(15);
  });

  it("sem 3+ → 20 emails/jour", () => {
    expect(getEmailRampUpCap(3)).toBe(20);
    expect(getEmailRampUpCap(10)).toBe(20);
  });
});

describe("parseEmailHealthRows", () => {
  it("parse les lignes Email_Health", () => {
    const rows = [
      [...EMAIL_HEALTH_HEADER],
      ["outreach.kamesai.com", "5", "0.02", "0.001", "9.5", "2026-05-14T09:00:00.000Z", "active"],
    ];
    const results = parseEmailHealthRows(rows);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      domain: "outreach.kamesai.com",
      sent_today: "5",
      bounce_rate_7d: "0.02",
      status: "active",
    });
  });

  it("retourne vide sans données", () => {
    expect(parseEmailHealthRows([])).toHaveLength(0);
    expect(parseEmailHealthRows([[...EMAIL_HEALTH_HEADER]])).toHaveLength(0);
  });
});

describe("formatEmailHealthRow", () => {
  it("génère un tableau de strings complet", () => {
    const row: EmailHealthRow = {
      domain: "outreach.kamesai.com",
      sent_today: "10",
      bounce_rate_7d: "0.03",
      complaint_rate_7d: "0.001",
      last_mail_tester_score: "9.8",
      last_check_at: "2026-05-14T10:00:00.000Z",
      status: "active",
    };
    const formatted = formatEmailHealthRow(row);
    expect(formatted).toHaveLength(EMAIL_HEALTH_HEADER.length);
    expect(formatted[0]).toBe("outreach.kamesai.com");
    expect(formatted[6]).toBe("active");
  });
});

describe("checkEmailHealth", () => {
  it("retourne allowed:true pour domaine actif", () => {
    const health: EmailHealthRow = {
      domain: "outreach.kamesai.com",
      sent_today: "5",
      bounce_rate_7d: "0.02",
      complaint_rate_7d: "0.001",
      last_mail_tester_score: "9.5",
      last_check_at: "2026-05-14T09:00:00.000Z",
      status: "active",
    };
    const result = checkEmailHealth("outreach.kamesai.com", health, 5, 50);
    expect(result.allowed).toBe(true);
  });

  it("bloque si statut paused_high_bounce", () => {
    const health: EmailHealthRow = {
      domain: "outreach.kamesai.com",
      sent_today: "10",
      bounce_rate_7d: "0.06",
      complaint_rate_7d: "0.001",
      last_mail_tester_score: "7",
      last_check_at: "2026-05-14T09:00:00.000Z",
      status: "paused_high_bounce",
    };
    const result = checkEmailHealth("outreach.kamesai.com", health, 10, 50);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("paused_high_bounce");
  });

  it("bloque si cap horaire atteint", () => {
    const health: EmailHealthRow = {
      domain: "outreach.kamesai.com",
      sent_today: "10",
      bounce_rate_7d: "0.01",
      complaint_rate_7d: "0.001",
      last_mail_tester_score: "9.5",
      last_check_at: "2026-05-14T09:00:00.000Z",
      status: "active",
    };
    const result = checkEmailHealth("outreach.kamesai.com", health, 55, 50);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cap_hourly");
  });

  it("bloque si domaine inconnu", () => {
    const result = checkEmailHealth("unknown.com", null, 0, 50);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("domain_not_found");
  });
});

// ——— LinkedIn pacing ———

describe("getLIRampUpCap", () => {
  it("sem 0 → 5 invitations/jour", () => {
    expect(getLIRampUpCap(0)).toBe(5);
  });

  it("sem 1 → 10 invitations/jour", () => {
    expect(getLIRampUpCap(1)).toBe(10);
  });

  it("sem 2 → 15 invitations/jour", () => {
    expect(getLIRampUpCap(2)).toBe(15);
  });

  it("sem 3+ → 20 invitations/jour (plafonné)", () => {
    expect(getLIRampUpCap(3)).toBe(20);
    expect(getLIRampUpCap(99)).toBe(20);
  });
});

describe("LI_CAP_WEEKLY", () => {
  it("vaut exactement 100 (non-overridable)", () => {
    expect(LI_CAP_WEEKLY).toBe(100);
  });
});

describe("LI_CAP_DAILY_MAX", () => {
  it("vaut 20 (plafond ramp-up)", () => {
    expect(LI_CAP_DAILY_MAX).toBe(20);
  });
});

describe("checkLIHealth", () => {
  it("autorise si tout ok", () => {
    const result = checkLIHealth("OK", 5, 30, 3);
    expect(result.allowed).toBe(true);
  });

  it("bloque si compte paused (ACTION_NEEDED)", () => {
    const result = checkLIHealth("ACTION_NEEDED", 0, 0, 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("li_account_paused");
  });

  it("bloque si compte CREDENTIALS", () => {
    const result = checkLIHealth("CREDENTIALS", 0, 0, 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("li_account_paused");
  });

  it("bloque si cap journalier ramp-up atteint (sem 0 → 5/j)", () => {
    const result = checkLIHealth("OK", 5, 10, 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cap_daily_li");
  });

  it("bloque si cap journalier custom atteint", () => {
    const result = checkLIHealth("OK", 12, 50, 3, 12);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cap_daily_li");
  });

  it("bloque si cap hebdomadaire HARD 100 atteint", () => {
    // sem 3 → cap 20/j, mais 100 cette semaine → bloqué
    const result = checkLIHealth("OK", 5, 100, 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cap_weekly_li");
  });

  it("refuse de dépasser 100/sem même avec cap daily custom élevé", () => {
    const result = checkLIHealth("OK", 15, 101, 3, 25);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cap_weekly_li");
  });
});

describe("sampleLITypingDelay", () => {
  it("retourne au moins 2 secondes (clamp minimum)", () => {
    for (let i = 0; i < 50; i++) {
      expect(sampleLITypingDelay()).toBeGreaterThanOrEqual(2);
    }
  });

  it("retourne un nombre (secondes)", () => {
    expect(typeof sampleLITypingDelay()).toBe("number");
  });
});

describe("shouldIncludeNote", () => {
  it("retourne un boolean", () => {
    expect(typeof shouldIncludeNote(0)).toBe("boolean");
  });

  it("ratio ~60% note sur 1000 appels (±10%)", () => {
    let withNote = 0;
    for (let i = 0; i < 1000; i++) {
      if (shouldIncludeNote(i)) withNote++;
    }
    // attendu : ~600, tolérance [500, 700]
    expect(withNote).toBeGreaterThanOrEqual(500);
    expect(withNote).toBeLessThanOrEqual(700);
  });
});
