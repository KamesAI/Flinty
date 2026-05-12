import { describe, it, expect, vi, beforeEach } from "vitest";
import { cacheClear, invalidateCampaignSheetIdCache } from "./cache";
import { getCampaignById, listCampaigns, parseIndexCampaigns } from "./campaigns";

vi.mock("./sheets", () => ({
  readIndex: vi.fn(),
}));

import { readIndex } from "./sheets";

const MOCK_HEADER = [
  "campaign_id",
  "nom",
  "sheet_id",
  "sheet_url",
  "secteur",
  "localisation",
  "offre_kames",
  "statut",
  "date_création",
  "total_leads_raw",
  "total_leads_qualified",
  "emails_envoyés",
  "taux_réponse",
];

const MOCK_ROWS = [
  MOCK_HEADER,
  [
    "camp-001",
    "Agences Paris",
    "1AbCdEf",
    "https://docs.google.com/spreadsheets/d/1AbCdEf",
    "Marketing",
    "Paris",
    "Audit IA",
    "active",
    "2026-04-01",
    "80",
    "40",
    "35",
    "12",
  ],
  [
    "camp-002",
    "Restaurants Lyon",
    "2XyZwVu",
    "https://docs.google.com/spreadsheets/d/2XyZwVu",
    "Restauration",
    "Lyon",
    "Audit IA",
    "paused",
    "2026-04-05",
    "30",
    "10",
    "5",
    "0",
  ],
];

describe("parseIndexCampaigns", () => {
  it("parse correctement les lignes de l'Index", () => {
    const campaigns = parseIndexCampaigns(MOCK_ROWS);
    expect(campaigns).toHaveLength(2);
    expect(campaigns[0]).toMatchObject({
      campaign_id: "camp-001",
      nom: "Agences Paris",
      sheet_id: "1AbCdEf",
      sheet_url: "https://docs.google.com/spreadsheets/d/1AbCdEf",
      secteur: "Marketing",
      localisation: "Paris",
      offre_kames: "Audit IA",
      statut: "active",
      date_création: "2026-04-01",
      total_leads_raw: "80",
      total_leads_qualified: "40",
      emails_envoyés: "35",
      taux_réponse: "12",
    });
  });

  it("retourne un tableau vide si rows est vide", () => {
    expect(parseIndexCampaigns([])).toEqual([]);
  });

  it("retourne un tableau vide si seul le header est présent", () => {
    expect(parseIndexCampaigns([MOCK_HEADER])).toEqual([]);
  });

  it("remplace les champs manquants par des valeurs par défaut", () => {
    const rows = [MOCK_HEADER, ["camp-003"]]; // ligne incomplète
    const campaigns = parseIndexCampaigns(rows);
    expect(campaigns[0].nom).toBe("");
    expect(campaigns[0].statut).toBe("new");
    expect(campaigns[0].total_leads_raw).toBe("0");
  });
});

describe("listCampaigns", () => {
  beforeEach(() => {
    vi.mocked(readIndex).mockResolvedValue(MOCK_ROWS);
  });

  it("retourne un tableau typé Campaign[]", async () => {
    const campaigns = await listCampaigns();
    expect(campaigns).toHaveLength(2);
    expect(campaigns[0].campaign_id).toBe("camp-001");
    expect(campaigns[1].statut).toBe("paused");
  });

  it("retourne un tableau vide si l'Index est vide", async () => {
    vi.mocked(readIndex).mockResolvedValue([]);
    const campaigns = await listCampaigns();
    expect(campaigns).toEqual([]);
  });
});

describe("getCampaignById", () => {
  beforeEach(() => {
    cacheClear();
    vi.mocked(readIndex).mockClear();
    vi.mocked(readIndex).mockResolvedValue(MOCK_ROWS);
  });

  it("retourne campaign + sheetId + sheetUrl pour un id existant", async () => {
    const result = await getCampaignById("camp-001");
    expect(result).not.toBeNull();
    expect(result!.campaign.campaign_id).toBe("camp-001");
    expect(result!.sheetId).toBe("1AbCdEf");
    expect(result!.sheetUrl).toBe("https://docs.google.com/spreadsheets/d/1AbCdEf");
  });

  it("retourne null pour un id inexistant sans lever d'exception", async () => {
    const result = await getCampaignById("inexistant");
    expect(result).toBeNull();
  });

  it("retourne null si l'Index est vide", async () => {
    vi.mocked(readIndex).mockResolvedValue([]);
    const result = await getCampaignById("camp-001");
    expect(result).toBeNull();
  });

  it("ne lève pas d'exception si readIndex rejette", async () => {
    vi.mocked(readIndex).mockRejectedValue(new Error("Sheets API down"));
    await expect(getCampaignById("camp-001")).rejects.toThrow("Sheets API down");
  });

  it("ne lit l’Index qu’une fois pour deux appels identiques (cache sheet_id)", async () => {
    await getCampaignById("camp-001");
    await getCampaignById("camp-001");
    expect(vi.mocked(readIndex).mock.calls.length).toBe(1);
  });

  it("après invalidateCampaignSheetIdCache, relit l’Index", async () => {
    await getCampaignById("camp-001");
    invalidateCampaignSheetIdCache();
    await getCampaignById("camp-001");
    expect(vi.mocked(readIndex).mock.calls.length).toBe(2);
  });
});
