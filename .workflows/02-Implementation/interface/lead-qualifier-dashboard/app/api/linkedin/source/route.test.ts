import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  getLatestLinkedInAccount: vi.fn(),
}));

import { getLatestLinkedInAccount } from "@/lib/sheets";

describe("POST /api/linkedin/source", () => {
  const NativeResponse = Response;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.N8N_WF9_WEBHOOK = "https://n8n.test/webhook/wf9";
    vi.stubGlobal("fetch", vi.fn(async () => new NativeResponse("ok", { status: 200 })));
    vi.mocked(getLatestLinkedInAccount).mockResolvedValue({
      account_id: "acc_123",
      type: "linkedin",
      provider: "unipile",
      status: "connected",
      connected_at: "2026-05-18T08:00:00.000Z",
      paused_reason: "",
      pause_started_at: "",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("declenche WF9 avec le canal et les params demandes", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/linkedin/source", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "cmp_1",
          channel: "post_engagers",
          params: { post_url: "https://www.linkedin.com/posts/test" },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, status: "queued" });
    expect(fetch).toHaveBeenCalledWith(
      "https://n8n.test/webhook/wf9",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"channel":"post_engagers"'),
      })
    );
  });

  it("refuse le sourcing si le compte LinkedIn n'est pas connecte", async () => {
    vi.mocked(getLatestLinkedInAccount).mockResolvedValueOnce(null);

    const response = await POST(
      new Request("https://flinty.test/api/linkedin/source", {
        method: "POST",
        body: JSON.stringify({ campaign_id: "cmp_1", channel: "profile_visitors", params: {} }),
      })
    );

    expect(response.status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });
});
