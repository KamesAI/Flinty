import { beforeEach, describe, expect, it, vi } from "vitest";

const getApiKeyRowsMock = vi.fn();
const readIndexMock = vi.fn();
const parseIndexCampaignsMock = vi.fn();
const getMeetingsMock = vi.fn();
const appendToChildSheetMock = vi.fn();

vi.mock("@/lib/sheets", () => ({
  getApiKeyRows: (...args: unknown[]) => getApiKeyRowsMock(...args),
  readIndex: (...args: unknown[]) => readIndexMock(...args),
  parseIndexCampaigns: (...args: unknown[]) => parseIndexCampaignsMock(...args),
  getMeetings: (...args: unknown[]) => getMeetingsMock(...args),
  appendToChildSheet: (...args: unknown[]) => appendToChildSheetMock(...args),
}));

import { GET as getCampaigns } from "./campaigns/route";
import { GET as getMeetings } from "./meetings/route";
import { POST as postLead } from "./leads/route";

const API_KEY_ROWS = [
  ["api_key", "workspace_id", "label", "created_at"],
  ["fk_live_a", "workspace-a", "", ""],
  ["fk_live_b", "workspace-b", "", ""],
];

const CAMPAIGNS = [
  {
    campaign_id: "cmp_a",
    nom: "Campagne A",
    statut: "active",
    workspace_id: "workspace-a",
    sheet_id: "sheet-a",
    total_leads_qualified: "10",
    emails_envoyés: "20",
    taux_réponse: "5%",
  },
  {
    campaign_id: "cmp_b",
    nom: "Campagne B",
    statut: "active",
    workspace_id: "workspace-b",
    sheet_id: "sheet-b",
    total_leads_qualified: "3",
    emails_envoyés: "6",
    taux_réponse: "2%",
  },
];

function request(url: string, init?: RequestInit & { apiKey?: string }) {
  const headers = new Headers(init?.headers);
  if (init?.apiKey) headers.set("x-api-key", init.apiKey);
  return new Request(url, { ...init, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  getApiKeyRowsMock.mockResolvedValue(API_KEY_ROWS);
  readIndexMock.mockResolvedValue([["header"]]);
  parseIndexCampaignsMock.mockReturnValue(CAMPAIGNS);
  getMeetingsMock.mockResolvedValue([
    { meeting_id: "m1", campaign_id: "cmp_a", status: "scheduled" },
    { meeting_id: "m2", campaign_id: "cmp_b", status: "scheduled" },
  ]);
  appendToChildSheetMock.mockResolvedValue(undefined);
});

describe("GET /api/public/campaigns", () => {
  it("401 sans clé ou clé invalide", async () => {
    expect((await getCampaigns(request("http://x/api/public/campaigns"))).status).toBe(401);
    expect(
      (await getCampaigns(request("http://x/api/public/campaigns", { apiKey: "fk_live_zzz" }))).status
    ).toBe(401);
  });

  it("retourne uniquement les campagnes du workspace, sans sheet_id", async () => {
    const res = await getCampaigns(request("http://x/api/public/campaigns", { apiKey: "fk_live_a" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.campaigns.map((c: { campaign_id: string }) => c.campaign_id)).toEqual(["cmp_a"]);
    expect(JSON.stringify(body)).not.toContain("sheet-a");
    expect(JSON.stringify(body)).not.toContain("cmp_b");
  });
});

describe("GET /api/public/meetings", () => {
  it("401 avec clé invalide", async () => {
    const res = await getMeetings(request("http://x/api/public/meetings", { apiKey: "nope" }));
    expect(res.status).toBe(401);
  });

  it("isolation stricte : la clé B ne voit pas les meetings de A", async () => {
    const res = await getMeetings(request("http://x/api/public/meetings", { apiKey: "fk_live_b" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meetings.map((m: { meeting_id: string }) => m.meeting_id)).toEqual(["m2"]);
  });
});

describe("POST /api/public/leads", () => {
  it("401 sans clé", async () => {
    const res = await postLead(
      request("http://x/api/public/leads", {
        method: "POST",
        body: JSON.stringify({ campaign_id: "cmp_a", lead: { nom: "Acme" } }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("400 sans campaign_id ou sans lead.nom", async () => {
    const res = await postLead(
      request("http://x/api/public/leads", {
        method: "POST",
        apiKey: "fk_live_a",
        body: JSON.stringify({ lead: { nom: "Acme" } }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("404 si la campagne appartient à un autre workspace", async () => {
    const res = await postLead(
      request("http://x/api/public/leads", {
        method: "POST",
        apiKey: "fk_live_a",
        body: JSON.stringify({ campaign_id: "cmp_b", lead: { nom: "Acme" } }),
      })
    );
    expect(res.status).toBe(404);
    expect(appendToChildSheetMock).not.toHaveBeenCalled();
  });

  it("append le lead dans Leads_Raw du GSheet enfant de la campagne", async () => {
    const res = await postLead(
      request("http://x/api/public/leads", {
        method: "POST",
        apiKey: "fk_live_a",
        body: JSON.stringify({
          campaign_id: "cmp_a",
          lead: { nom: "Acme Corp", site: "https://acme.fr", ville: "Paris", téléphone: "0102030405" },
        }),
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.lead_id).toMatch(/^api_/);
    expect(appendToChildSheetMock).toHaveBeenCalledTimes(1);
    const [sheetId, range, values] = appendToChildSheetMock.mock.calls[0];
    expect(sheetId).toBe("sheet-a");
    expect(range).toBe("Leads_Raw!A:J");
    expect(values[1]).toBe("cmp_a");
    expect(values[2]).toBe("Acme Corp");
    expect(values[3]).toBe("https://acme.fr");
    expect(values[4]).toBe("Paris");
  });
});
