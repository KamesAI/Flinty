import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/replies", () => ({
  markWarmupPositiveReply: vi.fn(),
}));

import { markWarmupPositiveReply } from "@/lib/replies";

function request(body: unknown) {
  return new Request("http://localhost/api/replies/lead_1/warmup-positive", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/[lead_id]/warmup-positive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tagge une reply positive warm-up", async () => {
    vi.mocked(markWarmupPositiveReply).mockResolvedValueOnce({
      turn_id: "turn_1",
      lead_id: "lead_1",
      channel: "email",
      role: "prospect",
      content: "OK",
      sent_at: "2026-05-18T10:00:00.000Z",
      intent: "interested",
      validated_by: "",
      edited_from_draft: "false",
      tags: "warmup_positive_reply",
    });

    const res = await POST(request({ turn_id: "turn_1" }), {
      params: Promise.resolve({ lead_id: "lead_1" }),
    });

    expect(res.status).toBe(200);
    expect(markWarmupPositiveReply).toHaveBeenCalledWith({
      lead_id: "lead_1",
      turn_id: "turn_1",
    });
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("rejette un body invalide", async () => {
    const res = await POST(request({}), {
      params: Promise.resolve({ lead_id: "lead_1" }),
    });

    expect(res.status).toBe(422);
  });
});
