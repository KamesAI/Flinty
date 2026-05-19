import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  QUALIFIED_SHEET_RANGE_WITH_HEADER: "A1:AB5000",
  getCampaignEmailTemplates: vi.fn(),
  parseIndexCampaigns: vi.fn(),
  parseLeadsV3: vi.fn(),
  readChildQualifiedLeads: vi.fn(),
  readIndex: vi.fn(),
}));

vi.mock("@/lib/replies", () => ({
  readCampaignConfig: vi.fn(),
}));

import {
  getCampaignEmailTemplates,
  parseIndexCampaigns,
  parseLeadsV3,
  readChildQualifiedLeads,
  readIndex,
} from "@/lib/sheets";
import { readCampaignConfig } from "@/lib/replies";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("POST /api/campaigns/[id]/send-j0", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T10:00:00.000Z"));
    vi.clearAllMocks();
    process.env.N8N_WF3_WEBHOOK = "https://staging-n8n.kamesai.com/webhook/kames-send-email-j0";
    vi.mocked(readIndex).mockResolvedValue([]);
    vi.mocked(parseIndexCampaigns).mockReturnValue([
      {
        campaign_id: "cmp_1",
        nom: "Warm-up",
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
      },
    ]);
    vi.mocked(readChildQualifiedLeads).mockResolvedValue([]);
    vi.mocked(parseLeadsV3).mockReturnValue(
      Array.from({ length: 8 }, (_, index) => ({
        lead_id: `lead_${index + 1}`,
        campaign_id: "cmp_1",
        nom: `Lead ${index + 1}`,
        prénom: "",
        poste: "",
        secteur: "",
        email: `lead${index + 1}@example.com`,
        téléphone: "",
        score: "100",
        site: "",
        ville: "",
        taille_equipe: "",
        has_ia_services: "",
        statut_email: "new",
        resend_email_id: "",
      }))
    );
    vi.mocked(getCampaignEmailTemplates).mockResolvedValue({});
    vi.mocked(readCampaignConfig).mockResolvedValue({});
    fetchMock.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cappe les envois warm-up à 5 emails J1 et préfixe le sujet", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValueOnce({
      warmup_campaign: "TRUE",
      warmup_started_at: "2026-05-18T00:00:00.000Z",
    });

    const res = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "cmp_1" }),
    });

    expect(res.status).toBe(200);
    const webhookBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(webhookBody).toMatchObject({
      campaign_id: "cmp_1",
      sheet_id: "sheet_1",
      leads_count: 5,
      warmup_campaign: true,
      warmup_max_daily_sends: 5,
      subject_prefix: "[WARMUP] ",
    });
    expect(await res.json()).toMatchObject({ success: true, leads_count: 5 });
  });
});
