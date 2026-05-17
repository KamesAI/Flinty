import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/replies", () => ({
  getReplyDetail: vi.fn(),
}));

import { getReplyDetail } from "@/lib/replies";

describe("GET /api/replies/[lead_id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne thread + lead + campagne", async () => {
    vi.mocked(getReplyDetail).mockResolvedValueOnce({
      lead: { lead_id: "lead_1" },
      campaign: { campaign_id: "cmp_1" },
      draft: { turn_id: "turn_1" },
      thread: [],
    } as never);

    const response = await GET(
      new Request("http://localhost/api/replies/lead_1"),
      { params: Promise.resolve({ lead_id: "lead_1" }) }
    );

    expect(response.status).toBe(200);
    expect(getReplyDetail).toHaveBeenCalledWith("lead_1");
    await expect(response.json()).resolves.toMatchObject({
      lead: { lead_id: "lead_1" },
      campaign: { campaign_id: "cmp_1" },
    });
  });

  it("retourne 404 sans draft/thread", async () => {
    vi.mocked(getReplyDetail).mockResolvedValueOnce(null);
    const response = await GET(
      new Request("http://localhost/api/replies/missing"),
      { params: Promise.resolve({ lead_id: "missing" }) }
    );
    expect(response.status).toBe(404);
  });
});
