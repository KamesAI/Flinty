import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  updateIndex: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { updateIndex } from "@/lib/sheets";

function request(body: object) {
  return new Request("http://localhost/api/campaigns/cmp_x/generation-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/campaigns/[id]/generation-complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateIndex).mockResolvedValue(undefined);
  });

  it("met à jour l'Index quand WF1 a terminé l'écriture des raw", async () => {
    const res = await POST(request({
      campaign_id: "cmp_x",
      raw_count: 142,
      target_raw_leads: 350,
      dedup_removed: 28,
      status: "completed",
    }), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(res.status).toBe(200);
    expect(updateIndex).toHaveBeenCalledWith("cmp_x", {
      statut: "active",
      total_leads_raw: "142",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    await expect(res.json()).resolves.toEqual({
      success: true,
      campaign_id: "cmp_x",
      raw_count: 142,
      target_raw_leads: 350,
    });
  });

  it("retourne 400 si le campaign_id du body ne correspond pas à l'URL", async () => {
    const res = await POST(request({ campaign_id: "cmp_other", raw_count: 10 }), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(res.status).toBe(400);
    expect(updateIndex).not.toHaveBeenCalled();
  });
});
