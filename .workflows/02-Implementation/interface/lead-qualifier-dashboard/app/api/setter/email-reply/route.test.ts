import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/replies", () => ({
  processEmailReply: vi.fn(),
}));

import { processEmailReply } from "@/lib/replies";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/setter/email-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/setter/email-reply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejette un payload invalide", async () => {
    const response = await POST(postRequest({ from_email: "bad", content: "" }));
    expect(response.status).toBe(422);
    expect(processEmailReply).not.toHaveBeenCalled();
  });

  it("rejette sans lead_id ni email", async () => {
    const response = await POST(postRequest({ content: "Bonjour" }));
    expect(response.status).toBe(422);
  });

  it("crée un draft Setter depuis une réponse Resend normalisée", async () => {
    vi.mocked(processEmailReply).mockResolvedValueOnce({
      lead_id: "lead_1",
      campaign_id: "cmp_1",
      prospect_turn_id: "turn_prospect",
      draft_turn_id: "turn_draft",
      intent: "interested",
      confidence: 0.91,
      escalated: false,
      setter_validation: false,
    });

    const response = await POST(postRequest({
      campaign_id: "cmp_1",
      from_email: "prospect@example.com",
      content: "Oui, intéressé.",
    }));

    expect(response.status).toBe(201);
    expect(processEmailReply).toHaveBeenCalledWith(expect.objectContaining({
      campaign_id: "cmp_1",
      from_email: "prospect@example.com",
      content: "Oui, intéressé.",
    }));
    await expect(response.json()).resolves.toMatchObject({
      draft_turn_id: "turn_draft",
      escalated: false,
    });
  });

  it("inclut setter_validation dans la réponse", async () => {
    vi.mocked(processEmailReply).mockResolvedValueOnce({
      lead_id: "lead_1",
      campaign_id: "cmp_1",
      prospect_turn_id: "turn_prospect",
      draft_turn_id: "turn_draft",
      intent: "interested",
      confidence: 0.91,
      escalated: false,
      setter_validation: true,
    });

    const response = await POST(postRequest({
      from_email: "prospect@example.com",
      content: "Je veux en savoir plus.",
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ setter_validation: true });
  });

  it("retourne 404 si le lead est introuvable", async () => {
    vi.mocked(processEmailReply).mockRejectedValueOnce(
      new Error("Lead introuvable pour cette réponse email")
    );

    const response = await POST(postRequest({
      from_email: "ghost@example.com",
      content: "Hello",
    }));

    expect(response.status).toBe(404);
  });
});
