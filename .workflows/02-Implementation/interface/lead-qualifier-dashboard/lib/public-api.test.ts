import { describe, expect, it, vi } from "vitest";

import {
  API_KEYS_HEADER,
  API_KEYS_SHEET_NAME,
  buildCrmPayload,
  dispatchCrmEvent,
  filterCampaignsByWorkspace,
  filterMeetingsByWorkspace,
  parseApiKeyRows,
  parseCrmConfig,
  resolveWorkspaceIdFromRows,
  toPublicCampaign,
} from "./public-api";

const HEADER_ROW = [...API_KEYS_HEADER] as string[];

describe("parseApiKeyRows", () => {
  it("ignore le header et les lignes sans api_key", () => {
    const rows = [
      HEADER_ROW,
      ["fk_live_abc", "workspace-a", "clé HubSpot", "2026-07-04"],
      ["", "workspace-b", "vide", ""],
    ];
    expect(parseApiKeyRows(rows)).toEqual([
      {
        api_key: "fk_live_abc",
        workspace_id: "workspace-a",
        label: "clé HubSpot",
        created_at: "2026-07-04",
      },
    ]);
  });

  it("retourne [] sans lignes", () => {
    expect(parseApiKeyRows([])).toEqual([]);
  });
});

describe("resolveWorkspaceIdFromRows", () => {
  const rows = [HEADER_ROW, ["fk_live_abc", "workspace-a", "", ""]];

  it("résout le workspace d'une clé valide", () => {
    expect(resolveWorkspaceIdFromRows("fk_live_abc", rows)).toBe("workspace-a");
  });

  it("retourne null pour une clé inconnue, vide ou header", () => {
    expect(resolveWorkspaceIdFromRows("fk_live_xxx", rows)).toBeNull();
    expect(resolveWorkspaceIdFromRows("", rows)).toBeNull();
    expect(resolveWorkspaceIdFromRows("api_key", rows)).toBeNull();
  });
});

describe("filterCampaignsByWorkspace / toPublicCampaign", () => {
  const campaigns = [
    { campaign_id: "cmp_a", nom: "A", statut: "active", workspace_id: "workspace-a", sheet_id: "sheet-a", total_leads_qualified: "12", emails_envoyés: "34", taux_réponse: "8%" },
    { campaign_id: "cmp_b", nom: "B", statut: "paused", workspace_id: "workspace-b", sheet_id: "sheet-b", total_leads_qualified: "", emails_envoyés: "", taux_réponse: "" },
  ] as never[];

  it("isole strictement par workspace (A ne voit pas B)", () => {
    const result = filterCampaignsByWorkspace(campaigns, "workspace-a");
    expect(result.map((c) => c.campaign_id)).toEqual(["cmp_a"]);
    expect(filterCampaignsByWorkspace(campaigns, "workspace-b").map((c) => c.campaign_id)).toEqual([
      "cmp_b",
    ]);
  });

  it("toPublicCampaign n'expose jamais sheet_id", () => {
    const pub = toPublicCampaign(filterCampaignsByWorkspace(campaigns, "workspace-a")[0]);
    expect(pub).toEqual({
      campaign_id: "cmp_a",
      nom: "A",
      statut: "active",
      total_leads_qualified: "12",
      emails_envoyés: "34",
      taux_réponse: "8%",
    });
    expect(JSON.stringify(pub)).not.toContain("sheet-a");
  });
});

describe("filterMeetingsByWorkspace", () => {
  const campaigns = [
    { campaign_id: "cmp_a", workspace_id: "workspace-a" },
    { campaign_id: "cmp_b", workspace_id: "workspace-b" },
  ] as never[];
  const meetings = [
    { meeting_id: "m1", campaign_id: "cmp_a" },
    { meeting_id: "m2", campaign_id: "cmp_b" },
    { meeting_id: "m3", campaign_id: "cmp_inconnu" },
  ] as never[];

  it("ne retourne que les meetings des campagnes du workspace", () => {
    expect(filterMeetingsByWorkspace(meetings, campaigns, "workspace-a").map((m) => m.meeting_id)).toEqual(["m1"]);
    expect(filterMeetingsByWorkspace(meetings, campaigns, "workspace-b").map((m) => m.meeting_id)).toEqual(["m2"]);
  });
});

describe("parseCrmConfig", () => {
  it("lit crm_webhook_url et crm_events CSV", () => {
    expect(
      parseCrmConfig({
        crm_webhook_url: "https://hooks.example.com/x",
        crm_events: "lead_qualified, meeting_booked",
      })
    ).toEqual({
      webhookUrl: "https://hooks.example.com/x",
      events: ["lead_qualified", "meeting_booked"],
    });
  });

  it("désactive tout si pas d'URL", () => {
    expect(parseCrmConfig({})).toEqual({ webhookUrl: "", events: [] });
  });

  it("ignore les events inconnus", () => {
    expect(
      parseCrmConfig({ crm_webhook_url: "https://x", crm_events: "meeting_booked,foo" }).events
    ).toEqual(["meeting_booked"]);
  });
});

describe("buildCrmPayload", () => {
  it("construit un payload HubSpot-compatible", () => {
    const payload = buildCrmPayload({
      event: "lead_qualified",
      timestamp: "2026-07-04T12:00:00.000Z",
      workspaceId: "kames-default",
      campaignId: "cmp_a",
      lead: {
        email: "prospect@company.com",
        name: "Jean Dupont",
        score: 87,
        company: "Acme Corp",
        linkedin_url: "https://linkedin.com/in/jeandupont",
      },
    });
    expect(payload).toEqual({
      event: "lead_qualified",
      timestamp: "2026-07-04T12:00:00.000Z",
      workspace_id: "kames-default",
      campaign_id: "cmp_a",
      lead: {
        email: "prospect@company.com",
        name: "Jean Dupont",
        score: 87,
        company: "Acme Corp",
        linkedin_url: "https://linkedin.com/in/jeandupont",
      },
    });
  });
});

describe("dispatchCrmEvent", () => {
  const payload = buildCrmPayload({
    event: "meeting_booked",
    timestamp: "2026-07-04T12:00:00.000Z",
    workspaceId: "kames-default",
    campaignId: "cmp_a",
    lead: { email: "p@c.fr", name: "", score: null, company: "", linkedin_url: "" },
  });

  it("POSTe le payload quand l'event est activé", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const sent = await dispatchCrmEvent({
      config: { crm_webhook_url: "https://hooks.example.com/x", crm_events: "meeting_booked" },
      payload,
      fetchImpl,
    });
    expect(sent).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith("https://hooks.example.com/x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("n'envoie rien si l'event n'est pas souscrit ou sans URL", async () => {
    const fetchImpl = vi.fn();
    expect(
      await dispatchCrmEvent({
        config: { crm_webhook_url: "https://hooks.example.com/x", crm_events: "lead_qualified" },
        payload,
        fetchImpl,
      })
    ).toBe(false);
    expect(
      await dispatchCrmEvent({ config: {}, payload, fetchImpl })
    ).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("ne throw jamais si le webhook échoue (fire-and-forget)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(
      dispatchCrmEvent({
        config: { crm_webhook_url: "https://hooks.example.com/x", crm_events: "meeting_booked" },
        payload,
        fetchImpl,
      })
    ).resolves.toBe(false);
  });
});

describe("constantes onglet ApiKeys", () => {
  it("expose le nom d'onglet et le header attendus", () => {
    expect(API_KEYS_SHEET_NAME).toBe("ApiKeys");
    expect([...API_KEYS_HEADER]).toEqual(["api_key", "workspace_id", "label", "created_at"]);
  });
});
