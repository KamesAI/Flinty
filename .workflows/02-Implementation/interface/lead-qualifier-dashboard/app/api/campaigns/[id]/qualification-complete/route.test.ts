import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  updateIndex: vi.fn(),
}));

import { updateIndex } from "@/lib/sheets";

function request(body: object) {
  return new Request("http://localhost/api/campaigns/cmp_x/qualification-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/campaigns/[id]/qualification-complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateIndex).mockResolvedValue(undefined);
  });

  it("passe le statut à active et met à jour le total qualifié quand WF2 a terminé", async () => {
    const res = await POST(
      request({
        campaign_id: "cmp_x",
        qualified_count: 38,
        status: "completed",
      }),
      { params: Promise.resolve({ id: "cmp_x" }) }
    );

    expect(res.status).toBe(200);
    expect(updateIndex).toHaveBeenCalledWith("cmp_x", {
      statut: "active",
      total_leads_qualified: "38",
    });
    await expect(res.json()).resolves.toEqual({
      success: true,
      campaign_id: "cmp_x",
      qualified_count: 38,
    });
  });

  it("met à jour uniquement le statut si qualified_count est absent", async () => {
    const res = await POST(request({ status: "completed" }), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(res.status).toBe(200);
    expect(updateIndex).toHaveBeenCalledWith("cmp_x", { statut: "active" });
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      qualified_count: null,
    });
  });

  it("retourne 400 si le campaign_id du body ne correspond pas à l'URL", async () => {
    const res = await POST(request({ campaign_id: "cmp_other", qualified_count: 1 }), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(res.status).toBe(400);
    expect(updateIndex).not.toHaveBeenCalled();
  });

  it("passe en paused si status failed", async () => {
    await POST(request({ status: "failed" }), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(updateIndex).toHaveBeenCalledWith("cmp_x", { statut: "paused" });
  });
});
