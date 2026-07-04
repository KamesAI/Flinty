import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  parseIndexCampaigns: vi.fn(),
  readIndex: vi.fn(),
  updateLeadFieldInChild: vi.fn(),
}));

import { updateLeadFieldInChild } from "@/lib/sheets";

describe("POST /api/linkedin/outreach-event", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("refuse sans bearer CRON_SECRET", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/linkedin/outreach-event", {
        method: "POST",
        body: JSON.stringify({ campaign_id: "cmp_1", sheet_id: "sheet_1", lead_id: "lead_1", statut_li: "invited" }),
      })
    );

    expect(response.status).toBe(401);
    expect(updateLeadFieldInChild).not.toHaveBeenCalled();
  });

  it("met a jour statut_li dans Leads_Qualified", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/linkedin/outreach-event", {
        method: "POST",
        headers: { Authorization: "Bearer cron-secret" },
        body: JSON.stringify({
          campaign_id: "cmp_1",
          sheet_id: "sheet_1",
          lead_id: "lead_1",
          statut_li: "dm_sent",
          event: "invitation.accepted",
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, lead_id: "lead_1", statut_li: "dm_sent" });
    expect(updateLeadFieldInChild).toHaveBeenCalledWith(
      "sheet_1",
      "cmp_1",
      "lead_1",
      "statut_li",
      "dm_sent"
    );
  });
});
