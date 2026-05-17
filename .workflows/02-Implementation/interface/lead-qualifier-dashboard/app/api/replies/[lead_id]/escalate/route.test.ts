import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/replies", () => ({
  escalateSetterDraft: vi.fn(),
}));

import { escalateSetterDraft } from "@/lib/replies";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/replies/lead_1/escalate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/[lead_id]/escalate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marque un draft comme escaladé", async () => {
    vi.mocked(escalateSetterDraft).mockResolvedValueOnce(undefined);
    const response = await POST(
      postRequest({ turn_id: "turn_1", escalated_by: "Thomas", reason: "sensible" }),
      { params: Promise.resolve({ lead_id: "lead_1" }) }
    );

    expect(response.status).toBe(200);
    expect(escalateSetterDraft).toHaveBeenCalledWith({
      lead_id: "lead_1",
      turn_id: "turn_1",
      escalated_by: "Thomas",
      reason: "sensible",
    });
  });
});
