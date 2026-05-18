import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/setter-graduation", () => ({
  graduateCampaign: vi.fn(),
}));

import { graduateCampaign } from "@/lib/setter-graduation";

describe("POST /api/setter/graduate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    vi.mocked(graduateCampaign).mockResolvedValue({
      graduated: false,
      accuracy: 0,
      reason: "insufficient_turns",
    });
  });

  it("répond 401 sans Authorization bearer CRON_SECRET", async () => {
    const res = await POST(new Request("http://localhost/api/setter/graduate?campaign_id=cmp_1"));

    expect(res.status).toBe(401);
    expect(graduateCampaign).not.toHaveBeenCalled();
  });

  it("répond 422 sans campaign_id", async () => {
    const res = await POST(new Request("http://localhost/api/setter/graduate", {
      method: "POST",
      headers: { Authorization: "Bearer cron-secret" },
    }));

    expect(res.status).toBe(422);
    expect(graduateCampaign).not.toHaveBeenCalled();
  });

  it("appelle graduateCampaign avec le campaign_id", async () => {
    vi.mocked(graduateCampaign).mockResolvedValueOnce({
      graduated: true,
      accuracy: 0.9,
    });

    const res = await POST(new Request("http://localhost/api/setter/graduate?campaign_id=cmp_1", {
      method: "POST",
      headers: { Authorization: "Bearer cron-secret" },
    }));

    expect(res.status).toBe(200);
    expect(graduateCampaign).toHaveBeenCalledWith("cmp_1");
    await expect(res.json()).resolves.toEqual({
      success: true,
      graduated: true,
      accuracy: 0.9,
    });
  });
});
