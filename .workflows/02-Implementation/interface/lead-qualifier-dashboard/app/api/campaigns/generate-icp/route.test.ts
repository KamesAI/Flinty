import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as OpenRouter from "@/lib/openrouter";
import * as Campaigns from "@/lib/campaigns";
import * as Sheets from "@/lib/sheets";
import { POST } from "./route";
import { resetRateLimitStore } from "@/lib/rate-limit";

const mockCreate = vi.fn();

const EIGHT = Array.from({ length: 8 }, (_, i) => `Réponse ${i + 1}`);

function makeReq(ip: string, answers: string[] = EIGHT, campaign_id?: string) {
  return new Request("http://localhost/api/campaigns/generate-icp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ answers, ...(campaign_id ? { campaign_id } : {}) }),
  });
}

describe("POST /api/campaigns/generate-icp", () => {
  beforeEach(() => {
    resetRateLimitStore();
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "# ICP généré" } }],
    });
    vi.spyOn(OpenRouter, "getOpenRouter").mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne 200 avec icp_md", async () => {
    const res = await POST(makeReq("203.0.113.1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.icp_md).toContain("ICP");
    expect(mockCreate).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "anthropic/claude-sonnet-4-5",
      }),
      { timeout: 30_000 },
    );
  });

  it("retourne 400 si answers n'a pas 8 entrées", async () => {
    const res = await POST(makeReq("203.0.113.2", ["a", "b"]));
    expect(res.status).toBe(400);
  });

  it("retourne 429 avec Retry-After au 6e appel / min / IP", async () => {
    const ip = "198.51.100.99";
    for (let i = 0; i < 5; i++) {
      const r = await POST(makeReq(ip));
      expect(r.status).toBe(200);
    }
    const blocked = await POST(makeReq(ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    const j = await blocked.json();
    expect(j.retryAfter).toBeDefined();
  });

  it("écrit icp_md dans Config si campaign_id fourni et campagne trouvée", async () => {
    vi.spyOn(Campaigns, "getCampaignById").mockResolvedValue({
      campaign: { campaign_id: "cmp_test" } as never,
      sheetId: "sheet_abc",
      sheetUrl: "https://docs.google.com/spreadsheets/d/sheet_abc",
    });
    const updateSpy = vi.spyOn(Sheets, "updateConfigValue").mockResolvedValue();

    const res = await POST(makeReq("203.0.113.3", EIGHT, "cmp_test"));
    expect(res.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith("sheet_abc", "cmp_test", "icp_md", "# ICP généré");
  });

  it("n'appelle pas updateConfigValue si campaign_id absent", async () => {
    const updateSpy = vi.spyOn(Sheets, "updateConfigValue").mockResolvedValue();

    await POST(makeReq("203.0.113.4"));
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("n'appelle pas updateConfigValue si campagne introuvable", async () => {
    vi.spyOn(Campaigns, "getCampaignById").mockResolvedValue(null);
    const updateSpy = vi.spyOn(Sheets, "updateConfigValue").mockResolvedValue();

    const res = await POST(makeReq("203.0.113.5", EIGHT, "cmp_inexistante"));
    expect(res.status).toBe(200);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
