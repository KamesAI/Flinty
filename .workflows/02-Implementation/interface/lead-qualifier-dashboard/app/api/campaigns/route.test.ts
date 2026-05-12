import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/campaigns", () => ({
  listCampaigns: vi.fn(),
}));
vi.mock("@/lib/sheets", () => ({
  appendIndex: vi.fn(),
  createChildGSheet: vi.fn(),
  updateIndex: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { listCampaigns } from "@/lib/campaigns";
import { resetRateLimitStore } from "@/lib/rate-limit";
import { appendIndex, createChildGSheet, updateIndex } from "@/lib/sheets";

const MOCK_CAMPAIGNS = [
  {
    campaign_id: "cmp_abc12345",
    nom: "Flinty — Marketing Paris 04/2026",
    sheet_id: "sid1",
    sheet_url: "https://docs.google.com/spreadsheets/d/sid1",
    secteur: "Marketing",
    localisation: "Paris",
    offre_kames: "Audit IA",
    statut: "new" as const,
    date_création: "2026-04-17",
    total_leads_raw: "0",
    total_leads_qualified: "0",
    emails_envoyés: "0",
    taux_réponse: "0",
  },
];

const VALID_POST_BODY = {
  nom: "Flinty — Marketing Paris 04/2026",
  secteur: "Marketing",
  localisation: "Paris",
  villes: "Paris, Lyon",
  offre_kames: "Audit IA",
  taille_equipe: "10-50",
  poste_cible: "Directeur Marketing",
  template_email: "j0_default",
  icp_md: "# ICP Test",
  score_minimum: 60,
  target_qualified_leads: 50,
  search_terms: "plomberie, électricité, menuiserie",
  search_locations: "Bordeaux, Mérignac, Pessac",
};

function postRequest(body: object, ip = "203.0.113.50") {
  return new Request("http://localhost/api/campaigns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("GET /api/campaigns", () => {
  it("retourne la liste des campagnes depuis l'Index (200)", async () => {
    vi.mocked(listCampaigns).mockResolvedValue(MOCK_CAMPAIGNS);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].campaign_id).toBe("cmp_abc12345");
  });

  it("retourne un tableau vide si l'Index est vide", async () => {
    vi.mocked(listCampaigns).mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });
});

describe("POST /api/campaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    vi.mocked(createChildGSheet).mockResolvedValue({
      spreadsheetId: "new-sheet-id-123",
      sheetUrl: "https://docs.google.com/spreadsheets/d/new-sheet-id-123",
    });
    vi.mocked(appendIndex).mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({ ok: true });
    process.env.N8N_WF1_WEBHOOK =
      "https://staging-n8n.kamesai.com/webhook/flinty-wf1-launch";
  });

  it("retourne 202 avec campaign_id + spreadsheet_id + sheet_url", async () => {
    const response = await POST(postRequest(VALID_POST_BODY));
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.campaign_id).toMatch(/^cmp_[a-z0-9]{8}$/);
    expect(data.spreadsheet_id).toBe("new-sheet-id-123");
    expect(data.sheet_url).toBe(
      "https://docs.google.com/spreadsheets/d/new-sheet-id-123"
    );
  });

  it("appelle createChildGSheet avec nom validé + score_minimum string", async () => {
    await POST(postRequest(VALID_POST_BODY));
    expect(createChildGSheet).toHaveBeenCalledWith(
      "Flinty — Marketing Paris 04/2026",
      expect.objectContaining({
        secteur: "Marketing",
        score_minimum: "60",
        target_qualified_leads: "50",
        target_raw_leads: "350",
        target_tolerance_percent: "10",
        estimated_qualification_rate: "0.15",
        search_terms: "plomberie, électricité, menuiserie",
        search_locations: "Bordeaux, Mérignac, Pessac",
        icp_md: "# ICP Test",
        campaign_id: expect.stringMatching(/^cmp_/),
      })
    );
  });

  it("appelle appendIndex avec exactement 13 colonnes (schéma v3)", async () => {
    await POST(postRequest(VALID_POST_BODY));
    expect(appendIndex).toHaveBeenCalledOnce();
    const row: string[] = vi.mocked(appendIndex).mock.calls[0][0];
    expect(row).toHaveLength(13);
    expect(row[4]).toBe("Marketing"); // secteur
    expect(row[5]).toBe("Paris"); // localisation
    expect(row[7]).toBe("generating"); // statut initial pendant WF1
    expect(row[9]).toBe("0"); // total_leads_raw
  });

  it("déclenche le webhook WF1 avec campaign_id + spreadsheet_id", async () => {
    const response = await POST(postRequest(VALID_POST_BODY));
    const data = await response.json();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://staging-n8n.kamesai.com/webhook/flinty-wf1-launch",
      expect.objectContaining({ method: "POST" })
    );
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.campaign_id).toBe(data.campaign_id);
    expect(fetchBody.spreadsheet_id).toBe("new-sheet-id-123");
    expect(fetchBody.secteur).toBe("Marketing");
    expect(fetchBody.target_qualified_leads).toBe(50);
    expect(fetchBody.target_raw_leads).toBe(350);
    expect(fetchBody.target_tolerance_percent).toBe(10);
    expect(fetchBody.estimated_qualification_rate).toBe(0.15);
    expect(fetchBody.search_terms).toBe("plomberie, électricité, menuiserie");
    expect(fetchBody.search_locations).toBe("Bordeaux, Mérignac, Pessac");
    expect(fetchBody.generation_callback_url).toBe(
      `http://localhost/api/campaigns/${data.campaign_id}/generation-complete`
    );
  });

  it("repasse la campagne en pause si le déclenchement WF1 échoue", async () => {
    mockFetch.mockRejectedValueOnce(new Error("n8n down"));
    const response = await POST(postRequest(VALID_POST_BODY));
    const data = await response.json();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(response.status).toBe(202);
    expect(data.campaign_id).toMatch(/^cmp_/);
    expect(updateIndex).toHaveBeenCalledWith(data.campaign_id, { statut: "paused" });
  });

  it("sans N8N_WF1_WEBHOOK : index en paused, 503, pas d’appel fetch", async () => {
    delete process.env.N8N_WF1_WEBHOOK;
    const response = await POST(postRequest(VALID_POST_BODY));
    expect(response.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(appendIndex).toHaveBeenCalledOnce();
    const row: string[] = vi.mocked(appendIndex).mock.calls[0][0];
    expect(row[7]).toBe("paused");
    const data = await response.json();
    expect(data.error).toMatch(/N8N_WF1_WEBHOOK/);
    expect(data.campaign_id).toMatch(/^cmp_/);
    expect(data.spreadsheet_id).toBe("new-sheet-id-123");
  });

  it("retourne 500 si createChildGSheet échoue", async () => {
    vi.mocked(createChildGSheet).mockRejectedValue(new Error("Drive API down"));
    const response = await POST(postRequest(VALID_POST_BODY));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("retourne 500 si appendIndex échoue", async () => {
    vi.mocked(appendIndex).mockRejectedValue(new Error("Sheets API down"));
    const response = await POST(postRequest(VALID_POST_BODY));
    expect(response.status).toBe(500);
  });

  it("retourne 400 si icp_md manquant ou vide", async () => {
    const bad = { ...VALID_POST_BODY, icp_md: "   " };
    const res = await POST(postRequest(bad));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("retourne 429 avec Retry-After après 10 POST / heure / IP", async () => {
    const ip = "198.51.100.2";
    for (let i = 0; i < 10; i++) {
      const r = await POST(postRequest(VALID_POST_BODY, ip));
      expect(r.status).toBe(202);
    }
    const blocked = await POST(postRequest(VALID_POST_BODY, ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    const j = await blocked.json();
    expect(j.retryAfter).toBeDefined();
  });
});
