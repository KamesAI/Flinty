import { beforeEach, describe, expect, it, vi } from "vitest";

const readIndexMock = vi.fn();
const parseIndexCampaignsMock = vi.fn();
const readChildQualifiedLeadsMock = vi.fn();
const parseLeadsV3Mock = vi.fn();
const readCampaignConfigMock = vi.fn();
const dispatchCrmEventMock = vi.fn();

vi.mock("@/lib/sheets", () => ({
  readIndex: (...args: unknown[]) => readIndexMock(...args),
  parseIndexCampaigns: (...args: unknown[]) => parseIndexCampaignsMock(...args),
  readChildQualifiedLeads: (...args: unknown[]) => readChildQualifiedLeadsMock(...args),
  parseLeadsV3: (...args: unknown[]) => parseLeadsV3Mock(...args),
  QUALIFIED_SHEET_RANGE_WITH_HEADER: "range",
}));

vi.mock("@/lib/replies", () => ({
  readCampaignConfig: (...args: unknown[]) => readCampaignConfigMock(...args),
}));

vi.mock("@/lib/public-api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/public-api")>();
  return {
    ...original,
    dispatchCrmEvent: (...args: unknown[]) => dispatchCrmEventMock(...args),
  };
});

import { notifyLeadsQualifiedSafe, notifyMeetingBookedSafe } from "./crm-notify";

const CAMPAIGN = {
  campaign_id: "cmp_a",
  sheet_id: "sheet-a",
  workspace_id: "workspace-a",
};

beforeEach(() => {
  vi.clearAllMocks();
  readIndexMock.mockResolvedValue([["header"]]);
  parseIndexCampaignsMock.mockReturnValue([CAMPAIGN]);
  readCampaignConfigMock.mockResolvedValue({
    crm_webhook_url: "https://hooks.example.com/x",
    crm_events: "lead_qualified,meeting_booked",
  });
  readChildQualifiedLeadsMock.mockResolvedValue([["header"]]);
  parseLeadsV3Mock.mockReturnValue([
    { lead_id: "l1", email: "a@b.fr", nom: "Acme", prénom: "Jean", score: "87", site: "acme.fr" },
  ]);
  dispatchCrmEventMock.mockResolvedValue(true);
});

describe("notifyLeadsQualifiedSafe", () => {
  it("dispatch un event lead_qualified par lead qualifié", async () => {
    const sent = await notifyLeadsQualifiedSafe("cmp_a");
    expect(sent).toBe(1);
    expect(dispatchCrmEventMock).toHaveBeenCalledTimes(1);
    const arg = dispatchCrmEventMock.mock.calls[0][0];
    expect(arg.payload.event).toBe("lead_qualified");
    expect(arg.payload.workspace_id).toBe("workspace-a");
    expect(arg.payload.campaign_id).toBe("cmp_a");
    expect(arg.payload.lead.email).toBe("a@b.fr");
  });

  it("ne lit pas les leads si le CRM n'est pas configuré", async () => {
    readCampaignConfigMock.mockResolvedValue({});
    const sent = await notifyLeadsQualifiedSafe("cmp_a");
    expect(sent).toBe(0);
    expect(readChildQualifiedLeadsMock).not.toHaveBeenCalled();
    expect(dispatchCrmEventMock).not.toHaveBeenCalled();
  });

  it("retourne 0 sans throw si les Sheets échouent", async () => {
    readIndexMock.mockRejectedValue(new Error("sheets down"));
    await expect(notifyLeadsQualifiedSafe("cmp_a")).resolves.toBe(0);
  });
});

describe("notifyMeetingBookedSafe", () => {
  it("dispatch un event meeting_booked avec l'email de l'invité", async () => {
    const sent = await notifyMeetingBookedSafe({
      campaignId: "cmp_a",
      sheetId: "sheet-a",
      inviteeEmail: "prospect@c.fr",
      inviteeName: "Jean Dupont",
    });
    expect(sent).toBe(true);
    const arg = dispatchCrmEventMock.mock.calls[0][0];
    expect(arg.payload.event).toBe("meeting_booked");
    expect(arg.payload.lead.email).toBe("prospect@c.fr");
    expect(arg.payload.lead.name).toBe("Jean Dupont");
  });

  it("retourne false sans throw si la config échoue", async () => {
    readCampaignConfigMock.mockRejectedValue(new Error("boom"));
    await expect(
      notifyMeetingBookedSafe({
        campaignId: "cmp_a",
        sheetId: "sheet-a",
        inviteeEmail: "p@c.fr",
        inviteeName: "",
      })
    ).resolves.toBe(false);
  });
});
