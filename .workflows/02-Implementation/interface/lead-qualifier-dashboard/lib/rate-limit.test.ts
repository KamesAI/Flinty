import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp, resetRateLimitStore } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("autorise jusqu'à max requêtes puis 429 logique", () => {
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("k1", 5, 60_000, t0)).toEqual({ ok: true });
    }
    const sixth = checkRateLimit("k1", 5, 60_000, t0);
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) expect(sixth.retryAfter).toBeGreaterThan(0);
  });

  it("nouvelle fenêtre après windowMs", () => {
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) checkRateLimit("k2", 5, 60_000, t0);
    expect(checkRateLimit("k2", 5, 60_000, t0).ok).toBe(false);
    const t1 = t0 + 60_001;
    expect(checkRateLimit("k2", 5, 60_000, t1)).toEqual({ ok: true });
  });
});

describe("getClientIp", () => {
  it("prend la première IP de x-forwarded-for", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("retourne unknown sans en-tête", () => {
    expect(getClientIp(new Request("http://x"))).toBe("unknown");
  });
});
