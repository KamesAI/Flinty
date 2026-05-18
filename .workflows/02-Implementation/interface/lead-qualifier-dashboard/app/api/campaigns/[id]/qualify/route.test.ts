import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  parseIndexCampaigns: vi.fn(),
  readIndex: vi.fn(),
}));

vi.mock("@/lib/replies", () => ({
  readCampaignConfig: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { parseIndexCampaigns, readIndex } from "@/lib/sheets";
import { readCampaignConfig } from "@/lib/replies";

describe("POST /api/campaigns/[id]/qualify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.N8N_WF2_WEBHOOK = "https://staging-n8n.kamesai.com/webhook/flinty-wf2-qualify";
    vi.mocked(readIndex).mockResolvedValue([]);
    vi.mocked(readCampaignConfig).mockResolvedValue({});
    vi.mocked(parseIndexCampaigns).mockReturnValue([
      {
        campaign_id: "cmp_x",
        nom: "Campagne X",
        sheet_id: "sheet-1",
        sheet_url: "https://docs.google.com/spreadsheets/d/sheet-1",
        secteur: "BTP",
        localisation: "Bordeaux",
        offre_kames: "Sites web",
        statut: "generating",
        date_création: "2026-04-25",
        total_leads_raw: "100",
        total_leads_qualified: "0",
        emails_envoyés: "0",
        taux_réponse: "0",
      },
    ]);
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("transmet l'URL de callback fin de qualification à n8n (WF2)", async () => {
    const res = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(res.status).toBe(200);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.campaign_id).toBe("cmp_x");
    expect(body.sheet_id).toBe("sheet-1");
    expect(body.qualification_callback_url).toBe(
      "http://localhost/api/campaigns/cmp_x/qualification-complete"
    );
  });

  it("transmet le bypass scoring warm-up à WF2", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValueOnce({ warmup_campaign: "TRUE" });

    const res = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(res.status).toBe(200);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      warmup_campaign: true,
      bypass_scoring: true,
      forced_score: 100,
    });
  });
});
