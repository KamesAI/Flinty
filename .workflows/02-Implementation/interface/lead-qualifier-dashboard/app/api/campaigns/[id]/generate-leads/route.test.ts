import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  parseIndexCampaigns: vi.fn(),
  readChildSheet: vi.fn(),
  readIndex: vi.fn(),
  updateIndex: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { parseIndexCampaigns, readChildSheet, readIndex, updateIndex } from "@/lib/sheets";

describe("POST /api/campaigns/[id]/generate-leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.N8N_WF1_WEBHOOK = "https://staging-n8n.kamesai.com/webhook/flinty-wf1-launch";
    vi.mocked(readIndex).mockResolvedValue([]);
    vi.mocked(parseIndexCampaigns).mockReturnValue([
      {
        campaign_id: "cmp_x",
        nom: "Campagne X",
        sheet_id: "sheet-1",
        sheet_url: "https://docs.google.com/spreadsheets/d/sheet-1",
        secteur: "BTP",
        localisation: "Bordeaux",
        offre_kames: "Sites web",
        statut: "new",
        date_création: "2026-04-25",
        total_leads_raw: "0",
        total_leads_qualified: "0",
        emails_envoyés: "0",
        taux_réponse: "0",
      },
    ]);
    vi.mocked(readChildSheet).mockResolvedValue([
      ["target_qualified_leads", "50"],
      ["target_raw_leads", "350"],
      ["target_tolerance_percent", "10"],
      ["estimated_qualification_rate", "0.15"],
      ["villes", "Bordeaux"],
      ["search_terms", "plomberie, électricité"],
      ["search_locations", "Bordeaux, Mérignac"],
      ["icp_md", "# ICP"],
    ]);
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("transmet les objectifs depuis Config au webhook WF1", async () => {
    const res = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "cmp_x" }),
    });

    expect(res.status).toBe(200);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.target_qualified_leads).toBe(50);
    expect(body.target_raw_leads).toBe(350);
    expect(body.target_tolerance_percent).toBe(10);
    expect(body.estimated_qualification_rate).toBe(0.15);
    expect(body.search_terms).toBe("plomberie, électricité");
    expect(body.search_locations).toBe("Bordeaux, Mérignac");
    expect(body.generation_callback_url).toBe(
      "http://localhost/api/campaigns/cmp_x/generation-complete"
    );
    expect(updateIndex).toHaveBeenCalledWith("cmp_x", { statut: "generating" });
  });
});
