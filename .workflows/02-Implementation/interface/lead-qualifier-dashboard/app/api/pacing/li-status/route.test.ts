import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/sheets", () => ({
  getLatestLinkedInHealth: vi.fn(),
}));

import { getLatestLinkedInHealth } from "@/lib/sheets";

describe("GET /api/pacing/li-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne les caps et restants pour un compte LinkedIn actif", async () => {
    vi.mocked(getLatestLinkedInHealth).mockResolvedValueOnce({
      account_id: "acc_123",
      status: "active",
      reason: "",
      pause_started_at: "",
      last_check_at: "2026-05-20T09:00:00.000Z",
      acceptance_rate_7d: "0.420",
      invites_sent_today: "4",
      invites_sent_week: "39",
    });

    const response = await GET(
      new Request("https://flinty.test/api/pacing/li-status?account_id=acc_123&week_index=3")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      account_id: "acc_123",
      allowed: true,
      reason: "",
      remaining_today: 16,
      remaining_week: 61,
      caps_li: {
        daily_invitations: 20,
        weekly_invitations: 100,
      },
    });
    expect(getLatestLinkedInHealth).toHaveBeenCalledWith("acc_123");
  });

  it("bloque si LI_Health status n'est pas active", async () => {
    vi.mocked(getLatestLinkedInHealth).mockResolvedValueOnce({
      account_id: "acc_123",
      status: "paused_captcha",
      reason: "Captcha LinkedIn detecte",
      pause_started_at: "2026-05-20T09:00:00.000Z",
      last_check_at: "2026-05-20T09:00:00.000Z",
      acceptance_rate_7d: "0.420",
      invites_sent_today: "0",
      invites_sent_week: "12",
    });

    const response = await GET(
      new Request("https://flinty.test/api/pacing/li-status?account_id=acc_123")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.allowed).toBe(false);
    expect(body.reason).toBe("paused_captcha");
    expect(body.remaining_today).toBe(0);
  });

  it("bloque si le cap hebdomadaire hard 100 est atteint", async () => {
    vi.mocked(getLatestLinkedInHealth).mockResolvedValueOnce({
      account_id: "acc_123",
      status: "active",
      reason: "",
      pause_started_at: "",
      last_check_at: "2026-05-20T09:00:00.000Z",
      acceptance_rate_7d: "0.420",
      invites_sent_today: "5",
      invites_sent_week: "100",
    });

    const response = await GET(
      new Request("https://flinty.test/api/pacing/li-status?account_id=acc_123&week_index=3")
    );
    const body = await response.json();

    expect(body).toMatchObject({
      allowed: false,
      reason: "cap_weekly_li",
      remaining_week: 0,
    });
  });
});
