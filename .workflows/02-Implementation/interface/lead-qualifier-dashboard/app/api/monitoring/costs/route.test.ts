import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, dynamic } from "./route";

const readIndexMock = vi.fn();
const parseIndexCampaignsMock = vi.fn();
const indexCampaignToCampaignMock = vi.fn();
const getMeetingsMock = vi.fn();
const getCostTrackingRowsMock = vi.fn();
const getGlobalConfigMock = vi.fn();
const sendCostThresholdEmailMock = vi.fn();

vi.mock("@/lib/sheets", () => ({
  readIndex: (...args: unknown[]) => readIndexMock(...args),
  parseIndexCampaigns: (...args: unknown[]) => parseIndexCampaignsMock(...args),
  indexCampaignToCampaign: (...args: unknown[]) => indexCampaignToCampaignMock(...args),
  getMeetings: (...args: unknown[]) => getMeetingsMock(...args),
  getCostTrackingRows: (...args: unknown[]) => getCostTrackingRowsMock(...args),
  getGlobalConfig: (...args: unknown[]) => getGlobalConfigMock(...args),
}));

vi.mock("@/lib/cost-alerts", () => ({
  sendCostThresholdEmail: (...args: unknown[]) => sendCostThresholdEmailMock(...args),
}));

describe("GET /api/monitoring/costs", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-05-20T12:00:00.000Z"));
    readIndexMock.mockResolvedValue([["campaign_id"]]);
    parseIndexCampaignsMock.mockReturnValue([
      { campaign_id: "cmp_1", nom: "C1", workspace_id: "workspace-a" },
      { campaign_id: "cmp_2", nom: "C2", workspace_id: "workspace-b" },
    ]);
    indexCampaignToCampaignMock.mockImplementation((campaign) => ({
      campaign_id: campaign.campaign_id,
      nom: campaign.nom,
      secteur: "",
      localisation: "",
      date_création: "",
      offre_kames: "",
      statut: "active",
      total_leads_raw: "0",
      total_leads_qualified: "0",
      emails_envoyés: "0",
      taux_ouverture: "0",
      taux_réponse: "0",
      workspace_id: campaign.workspace_id,
    }));
    getCostTrackingRowsMock.mockResolvedValue([
      {
        date: "2026-05-20",
        campaign_id: "cmp_1",
        anthropic_tokens: 1000,
        anthropic_cost_usd: 20,
        unipile_actions: 0,
        calendly_calls: 1,
      },
    ]);
    getMeetingsMock.mockResolvedValue([
      {
        meeting_id: "m_1",
        lead_id: "lead_1",
        campaign_id: "cmp_1",
        calendly_event_uri: "event",
        invitee_email: "a@example.com",
        start_at: "2026-05-19T10:00:00.000Z",
        end_at: "2026-05-19T10:30:00.000Z",
        status: "scheduled",
        created_at: "2026-05-18T10:00:00.000Z",
      },
    ]);
    getGlobalConfigMock.mockResolvedValue({ alert_cost_per_meeting_threshold: "15" });
    sendCostThresholdEmailMock.mockResolvedValue(false);
  });

  it("force une lecture dynamique", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("retourne le résumé coûts filtré par workspace", async () => {
    const response = await GET(new Request("http://localhost/api/monitoring/costs?workspace_id=workspace-a"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.workspaceId).toBe("workspace-a");
    expect(body.thresholdUsd).toBe(15);
    expect(body.month.anthropicTokens).toBe(1000);
    expect(body.costPerMeetingUsd).toBe(20);
    expect(body.alert.triggered).toBe(true);
    expect(sendCostThresholdEmailMock).toHaveBeenCalledOnce();
  });

  it("retourne 400 sans workspace_id", async () => {
    const response = await GET(new Request("http://localhost/api/monitoring/costs"));
    expect(response.status).toBe(400);
  });
});
