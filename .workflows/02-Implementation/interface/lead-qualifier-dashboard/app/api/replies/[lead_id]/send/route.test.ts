import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/replies", () => ({
  triggerSetterSend: vi.fn(),
}));

import { triggerSetterSend } from "@/lib/replies";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/replies/lead_1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/[lead_id]/send", () => {
  beforeEach(() => vi.clearAllMocks());

  it("déclenche WF8 via le helper send", async () => {
    vi.mocked(triggerSetterSend).mockResolvedValueOnce(undefined);
    const response = await POST(
      postRequest({ turn_id: "turn_1", validated_by: "Thomas", edited_content: "Réponse éditée" }),
      { params: Promise.resolve({ lead_id: "lead_1" }) }
    );

    expect(response.status).toBe(200);
    expect(triggerSetterSend).toHaveBeenCalledWith({
      lead_id: "lead_1",
      turn_id: "turn_1",
      validated_by: "Thomas",
      edited_content: "Réponse éditée",
    });
  });

  it("retourne 503 si WF8 n'est pas configuré", async () => {
    vi.mocked(triggerSetterSend).mockRejectedValueOnce(new Error("N8N_WF8_WEBHOOK non configuré"));
    const response = await POST(
      postRequest({ turn_id: "turn_1", validated_by: "Thomas" }),
      { params: Promise.resolve({ lead_id: "lead_1" }) }
    );
    expect(response.status).toBe(503);
  });
});
