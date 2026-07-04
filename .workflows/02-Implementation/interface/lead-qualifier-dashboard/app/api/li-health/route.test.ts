import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  appendLinkedInHealthHistory: vi.fn(),
  getLatestLinkedInHealth: vi.fn(),
  upsertLinkedInHealth: vi.fn(),
}));

import {
  appendLinkedInHealthHistory,
  getLatestLinkedInHealth,
  upsertLinkedInHealth,
} from "@/lib/sheets";

describe("GET /api/li-health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne active par defaut sans ligne LI_Health", async () => {
    vi.mocked(getLatestLinkedInHealth).mockResolvedValueOnce(null);

    const response = await GET(new Request("https://flinty.test/api/li-health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "active", account_id: "" });
  });

  it("filtre par account_id si fourni en query param", async () => {
    vi.mocked(getLatestLinkedInHealth).mockResolvedValueOnce({
      account_id: "acc_123",
      status: "active",
      reason: "",
      pause_started_at: "",
      last_check_at: "2026-05-20T09:00:00.000Z",
      acceptance_rate_7d: "0.420",
    });

    const response = await GET(
      new Request("https://flinty.test/api/li-health?account_id=acc_123")
    );
    const body = await response.json();

    expect(body.account_id).toBe("acc_123");
    expect(getLatestLinkedInHealth).toHaveBeenCalledWith("acc_123");
  });
});

describe("POST /api/li-health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("refuse sans bearer CRON_SECRET quand CRON_SECRET est configure", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/li-health", {
        method: "POST",
        body: JSON.stringify({ account_id: "acc_123", status: "active" }),
      })
    );

    expect(response.status).toBe(401);
    expect(upsertLinkedInHealth).not.toHaveBeenCalled();
  });

  it("upsert LI_Health et append LI_Health_History", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/li-health", {
        method: "POST",
        headers: { Authorization: "Bearer cron-secret" },
        body: JSON.stringify({
          account_id: "acc_123",
          status: "paused_captcha",
          reason: "Captcha LinkedIn detecte",
          pause_started_at: "2026-05-20T09:00:00.000Z",
          last_check_at: "2026-05-20T09:00:00.000Z",
          acceptance_rate_7d: "0.420",
          invites_sent_7d: "12",
          invites_accepted_7d: "5",
          invites_sent_today: "4",
          invites_sent_week: "39",
          organic_action: "view",
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, status: "paused_captcha" });
    expect(upsertLinkedInHealth).toHaveBeenCalledWith(
      expect.objectContaining({
        account_id: "acc_123",
        status: "paused_captcha",
        invites_sent_today: "4",
        invites_sent_week: "39",
        organic_action: "view",
      })
    );
    expect(appendLinkedInHealthHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        account_id: "acc_123",
        invites_sent_7d: "12",
        invites_accepted_7d: "5",
      })
    );
  });
});
