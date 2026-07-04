import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/conversations", () => ({
  appendConversationTurn: vi.fn(),
  generateTurnId: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  parseIndexCampaigns: vi.fn(),
  readIndex: vi.fn(),
}));

import { appendConversationTurn, generateTurnId } from "@/lib/conversations";

describe("POST /api/linkedin/setter-li-turns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    vi.mocked(generateTurnId)
      .mockReturnValueOnce("turn_prospect")
      .mockReturnValueOnce("turn_setter");
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("refuse sans bearer CRON_SECRET", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/linkedin/setter-li-turns", {
        method: "POST",
        body: JSON.stringify({ campaign_id: "cmp_1", sheet_id: "sheet_1", lead_id: "lead_1" }),
      })
    );

    expect(response.status).toBe(401);
    expect(appendConversationTurn).not.toHaveBeenCalled();
  });

  it("append le message prospect et le draft setter en channel=linkedin", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/linkedin/setter-li-turns", {
        method: "POST",
        headers: { Authorization: "Bearer cron-secret" },
        body: JSON.stringify({
          campaign_id: "cmp_1",
          sheet_id: "sheet_1",
          lead_id: "lead_1",
          prospect_text: "Quels sont vos prix ?",
          setter_text: "Voici le lien Calendly : https://calendly.com/kames/test",
          intent: "objection_price",
          sent_at: "2026-07-04T11:30:00.000Z",
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, turns_appended: 2 });
    expect(appendConversationTurn).toHaveBeenNthCalledWith(
      1,
      "sheet_1",
      expect.objectContaining({
        turn_id: "turn_prospect",
        lead_id: "lead_1",
        channel: "linkedin",
        role: "prospect",
        content: "Quels sont vos prix ?",
      })
    );
    expect(appendConversationTurn).toHaveBeenNthCalledWith(
      2,
      "sheet_1",
      expect.objectContaining({
        turn_id: "turn_setter",
        lead_id: "lead_1",
        channel: "linkedin",
        role: "setter",
        content: "Voici le lien Calendly : https://calendly.com/kames/test",
        tags: "setter_draft,linkedin",
      })
    );
  });
});
