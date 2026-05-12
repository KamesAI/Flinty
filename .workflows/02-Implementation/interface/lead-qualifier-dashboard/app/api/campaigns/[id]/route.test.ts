import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mSheets = vi.hoisted(() => ({
  readChildSheet: vi.fn(),
  readChildQualifiedLeads: vi.fn(),
}));

vi.mock("@/lib/campaigns", () => ({
  getCampaignById: vi.fn(),
}));
vi.mock("@/lib/sheets", () => ({
  readChildSheet: mSheets.readChildSheet,
  readChildQualifiedLeads: mSheets.readChildQualifiedLeads,
  updateIndex: vi.fn(),
  QUALIFIED_SHEET_RANGE_DATA_ROWS: "A2:AB5000",
}));

import { getCampaignById } from "@/lib/campaigns";
import { readChildSheet, readChildQualifiedLeads } from "@/lib/sheets";

const MOCK_CAMPAIGN = {
  campaign_id: "cmp_abc12345",
  nom: "Flinty — Marketing Paris 04/2026",
  sheet_id: "sheet-id-123",
  sheet_url: "https://docs.google.com/spreadsheets/d/sheet-id-123",
  secteur: "Marketing",
  localisation: "Paris",
  offre_kames: "Audit IA",
  statut: "active" as const,
  date_création: "2026-04-17",
  total_leads_raw: "20",
  total_leads_qualified: "5",
  emails_envoyés: "0",
  taux_réponse: "0",
};

const MOCK_QUALIFIED_ROWS = [
  ["lead_001", "cmp_abc12345", "Agence Alpha", "alpha.fr", "Paris", "82", "Fort signal IA", "contact@alpha.fr", "01 23 45 67 89", "Julie", "DG", "Marketing", "10-50", "true", "", "growth", "", "", "contacted", "75", ""],
];

const MOCK_REJECTED_ROWS = [
  ["lead_002", "cmp_abc12345", "Micro Beta", "beta.fr", "35", "Score trop bas", "2026-04-17T10:00:00.000Z"],
];

const MOCK_CONFIG_ROWS = [
  ["icp_md", "# ICP Test", "ICP généré par Claude"],
  ["secteur", "Marketing", "Secteur cible"],
  ["score_minimum", "60", "Seuil qualification (%)"],
];

function makeRequest(id: string) {
  return new Request(`http://localhost/api/campaigns/${id}`);
}

describe("GET /api/campaigns/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 404 si campaign_id inconnu", async () => {
    vi.mocked(getCampaignById).mockResolvedValue(null);
    const res = await GET(makeRequest("inexistant"), { params: Promise.resolve({ id: "inexistant" }) });
    expect(res.status).toBe(404);
  });

  it("retourne 200 avec campaign + leads_qualified + leads_rejected + config", async () => {
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign: MOCK_CAMPAIGN,
      sheetId: "sheet-id-123",
      sheetUrl: "https://docs.google.com/spreadsheets/d/sheet-id-123",
    });
    vi.mocked(readChildQualifiedLeads).mockResolvedValueOnce(MOCK_QUALIFIED_ROWS);
    vi.mocked(readChildSheet)
      .mockResolvedValueOnce(MOCK_REJECTED_ROWS)
      .mockResolvedValueOnce(MOCK_CONFIG_ROWS);

    const res = await GET(makeRequest("cmp_abc12345"), { params: Promise.resolve({ id: "cmp_abc12345" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.campaign.campaign_id).toBe("cmp_abc12345");
    expect(data.leads_qualified).toHaveLength(1);
    expect(data.leads_rejected).toHaveLength(1);
    expect(data.config.score_minimum).toBe("60");
  });

  it("lit les 3 onglets avec les bons noms (prefixe campaign_id)", async () => {
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign: MOCK_CAMPAIGN,
      sheetId: "sheet-id-123",
      sheetUrl: "https://docs.google.com/spreadsheets/d/sheet-id-123",
    });
    vi.mocked(readChildQualifiedLeads).mockResolvedValueOnce([]);
    vi.mocked(readChildSheet).mockResolvedValue([]);

    await GET(makeRequest("cmp_abc12345"), { params: Promise.resolve({ id: "cmp_abc12345" }) });

    expect(readChildQualifiedLeads).toHaveBeenCalledWith(
      "sheet-id-123",
      "cmp_abc12345",
      "A2:AB5000"
    );
    expect(readChildSheet).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(readChildSheet).mock.calls;
    expect(calls[0][1]).toContain("cmp_abc12345_Rejected");
    expect(calls[1][1]).toContain("cmp_abc12345_Config");
  });

  it("les 3 appels (qualified + 2 onglets) partagent le même sheetId", async () => {
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign: MOCK_CAMPAIGN,
      sheetId: "sheet-id-123",
      sheetUrl: "https://docs.google.com/spreadsheets/d/sheet-id-123",
    });
    vi.mocked(readChildQualifiedLeads).mockResolvedValueOnce([]);
    vi.mocked(readChildSheet).mockResolvedValue([]);

    await GET(makeRequest("cmp_abc12345"), { params: Promise.resolve({ id: "cmp_abc12345" }) });

    expect(readChildQualifiedLeads).toHaveBeenCalledWith("sheet-id-123", "cmp_abc12345", "A2:AB5000");
    const sheetCalls = vi.mocked(readChildSheet).mock.calls;
    expect(sheetCalls.every((c) => c[0] === "sheet-id-123")).toBe(true);
  });

  it("parse correctement un lead qualifié (21 colonnes v3)", async () => {
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign: MOCK_CAMPAIGN,
      sheetId: "sheet-id-123",
      sheetUrl: "https://docs.google.com/spreadsheets/d/sheet-id-123",
    });
    vi.mocked(readChildQualifiedLeads).mockResolvedValueOnce(MOCK_QUALIFIED_ROWS);
    vi.mocked(readChildSheet).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const res = await GET(makeRequest("cmp_abc12345"), { params: Promise.resolve({ id: "cmp_abc12345" }) });
    const data = await res.json();
    const lead = data.leads_qualified[0];
    expect(lead.lead_id).toBe("lead_001");
    expect(lead.score).toBe("82");
    expect(lead.email).toBe("contact@alpha.fr");
    expect(lead.statut_email).toBe("contacted");
  });

  it("retourne leads_qualified vide si onglet vide", async () => {
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign: MOCK_CAMPAIGN,
      sheetId: "sheet-id-123",
      sheetUrl: "https://docs.google.com/spreadsheets/d/sheet-id-123",
    });
    vi.mocked(readChildQualifiedLeads).mockResolvedValueOnce([]);
    vi.mocked(readChildSheet).mockResolvedValue([]);

    const res = await GET(makeRequest("cmp_abc12345"), { params: Promise.resolve({ id: "cmp_abc12345" }) });
    const data = await res.json();
    expect(data.leads_qualified).toEqual([]);
    expect(data.leads_rejected).toEqual([]);
    expect(data.config).toEqual({});
  });
});
