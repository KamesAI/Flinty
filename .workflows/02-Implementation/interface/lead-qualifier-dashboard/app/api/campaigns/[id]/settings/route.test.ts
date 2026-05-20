import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";

vi.mock("@/lib/campaigns", () => ({
  getCampaignById: vi.fn(),
}));

vi.mock("@/lib/replies", () => ({
  readCampaignConfig: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  updateConfigValue: vi.fn(),
}));

import { getCampaignById } from "@/lib/campaigns";
import { readCampaignConfig } from "@/lib/replies";
import { updateConfigValue } from "@/lib/sheets";

const campaign = {
  campaign_id: "cmp_1",
  nom: "Campagne Test",
  sheet_id: "sheet_1",
  sheet_url: "",
  secteur: "SaaS",
  localisation: "Paris",
  offre_kames: "Audit IA",
  statut: "active",
  date_création: "2026-05-18",
  total_leads_raw: "0",
  total_leads_qualified: "0",
  emails_envoyés: "0",
  taux_réponse: "0",
};

function req(method: string, body?: unknown) {
  return new Request("http://localhost/api/campaigns/cmp_1/settings", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

describe("/api/campaigns/[id]/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CALENDLY_EVENT_TYPE_URI = "https://calendly.com/kames/demo";
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign,
      sheetId: "sheet_1",
      sheetUrl: "",
    });
  });

  it("GET retourne les settings normalisés depuis Config", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValueOnce({
      setter_enabled: "TRUE",
      setter_validation: "FALSE",
      setter_validation_locked_until: "2026-06-01",
      warmup_campaign: "TRUE",
      warmup_started_at: "2026-05-18T00:00:00.000Z",
      warmup_positive_replies: "2",
      setter_tone: "casual",
      setter_signature: "Thomas",
      calendly_event_uri: "",
      loom_video_url: "https://www.loom.com/share/demo",
    });

    const res = await GET(req("GET"), { params: Promise.resolve({ id: "cmp_1" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      setter_enabled: true,
      setter_validation: false,
      setter_validation_locked_until: "2026-06-01",
      warmup_campaign: true,
      warmup_positive_replies: 2,
      setter_tone: "casual",
      setter_signature: "Thomas",
      calendly_event_uri: "https://calendly.com/kames/demo",
      loom_video_url: "https://www.loom.com/share/demo",
    });
  });

  it("PUT met à jour uniquement les clés autorisées", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValue({});

    const res = await PUT(req("PUT", {
      setter_enabled: true,
      setter_validation: false,
      warmup_campaign: true,
      setter_tone: "formal",
      setter_signature: "Thomas Callendreau",
      calendly_event_uri: "https://calendly.com/kames/audit",
      loom_video_url: "https://www.loom.com/share/demo",
      li_caps_daily: "999",
    }), { params: Promise.resolve({ id: "cmp_1" }) });

    expect(res.status).toBe(200);
    expect(updateConfigValue).toHaveBeenCalledTimes(8);
    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "setter_enabled", "TRUE");
    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "setter_validation", "FALSE");
    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "warmup_campaign", "TRUE");
    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "warmup_started_at", expect.any(String));
    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "loom_video_url", "https://www.loom.com/share/demo");
    expect(updateConfigValue).not.toHaveBeenCalledWith(
      "sheet_1",
      "cmp_1",
      "li_caps_daily",
      expect.any(String)
    );
  });

  it("retourne 404 si la campagne est introuvable", async () => {
    vi.mocked(getCampaignById).mockResolvedValueOnce(null);
    const res = await GET(req("GET"), { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });
});
