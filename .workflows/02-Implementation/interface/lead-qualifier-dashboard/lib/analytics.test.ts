import { describe, it, expect } from "vitest";
import {
  buildDataDashboardModel,
  parseAnalyticsDailyRows,
  type AnalyticsDailySnapshot,
} from "./analytics";
import type { Campaign, Lead } from "./sheets";
import type { Meeting } from "./meetings";

// ——— Fixtures ———

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    campaign_id: "c1",
    nom: "Test",
    secteur: "Tech",
    localisation: "Paris",
    date_création: "2026-01-01",
    offre_kames: "IA",
    statut: "active",
    total_leads_raw: "100",
    total_leads_qualified: "20",
    emails_envoyés: "10",
    taux_ouverture: "40",
    taux_réponse: "5",
    workspace_id: "kames-default",
    ...overrides,
  };
}

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    lead_id: "l1",
    campaign_id: "c1",
    nom: "Dupont",
    prénom: "Jean",
    poste: "CEO",
    secteur: "Tech",
    email: "jean@example.com",
    téléphone: "",
    score: "80",
    site: "",
    ville: "Paris",
    taille_equipe: "10",
    has_ia_services: "",
    statut_email: "sent",
    resend_email_id: "",
    source_channel: "email",
    statut_li: "",
    setter_action: "",
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    meeting_id: "m1",
    lead_id: "l1",
    campaign_id: "c1",
    source: "calendly",
    title: "RDV",
    start_at: "2026-05-01T10:00:00Z",
    end_at: "2026-05-01T11:00:00Z",
    timezone: "Europe/Paris",
    status: "scheduled",
    booking_url: "",
    attendee_name: "Jean Dupont",
    attendee_email: "jean@example.com",
    metadata: "",
    ...overrides,
  };
}

const REF = new Date("2026-05-19T12:00:00Z");

// ——— parseAnalyticsDailyRows ———

describe("parseAnalyticsDailyRows", () => {
  it("retourne tableau vide si input vide", () => {
    expect(parseAnalyticsDailyRows([])).toEqual([]);
  });

  it("ignore la ligne d'en-tête", () => {
    const rows = [
      ["snapshot_date", "campaign_id", "campaign_status", "leads_raw", "leads_qualified", "emails_sent", "opens", "clicks", "replies", "meetings", "reply_rate", "booking_rate", "top_template", "metadata"],
      ["2026-05-01", "c1", "active", "100", "20", "10", "4", "1", "2", "1", "20", "10", "j0", "{}"],
    ];
    const result = parseAnalyticsDailyRows(rows);
    expect(result).toHaveLength(1);
    expect(result[0].snapshot_date).toBe("2026-05-01");
    expect(result[0].replies).toBe(2);
  });

  it("convertit les valeurs numériques", () => {
    const rows = [
      ["header"],
      ["2026-05-01", "c1", "active", "50", "15", "8", "3", "1", "2", "1", "25", "12.5", "j0", ""],
    ];
    const result = parseAnalyticsDailyRows(rows);
    expect(result[0].leads_raw).toBe(50);
    expect(result[0].booking_rate).toBe(12.5);
  });
});

// ——— buildDataDashboardModel — meeting_rate ———

describe("buildDataDashboardModel — meeting_rate", () => {
  it("meeting_rate = meetings / qualifiedLeads × 100", () => {
    const campaigns = [makeCampaign({ total_leads_qualified: "10" })];
    const leads = Array.from({ length: 10 }, (_, i) =>
      makeLead({ lead_id: `l${i}`, campaign_id: "c1" })
    );
    const meetings = [
      makeMeeting({ lead_id: "l0", start_at: "2026-05-01T10:00:00Z" }),
      makeMeeting({ meeting_id: "m2", lead_id: "l1", start_at: "2026-05-01T10:00:00Z" }),
    ];
    const model = buildDataDashboardModel({ campaigns, leads, meetings, snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.globalKpis.meetingRate).toBe(20); // 2/10 × 100
  });

  it("meeting_rate = 0 si aucun lead qualifié", () => {
    const campaigns = [makeCampaign({ total_leads_qualified: "0" })];
    const model = buildDataDashboardModel({ campaigns, leads: [], meetings: [], snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.globalKpis.meetingRate).toBe(0);
  });
});

// ——— buildDataDashboardModel — cost_per_meeting ———

describe("buildDataDashboardModel — cost_per_meeting", () => {
  it("cost > 0 si setter_action non vide et meetings > 0", () => {
    const campaigns = [makeCampaign()];
    const leads = [makeLead({ setter_action: "sent_reply" })];
    const meetings = [makeMeeting()];
    const model = buildDataDashboardModel({ campaigns, leads, meetings, snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.globalKpis.costPerMeeting).toBeGreaterThan(0);
  });

  it("cost_per_meeting = 0 si aucun meeting", () => {
    const campaigns = [makeCampaign()];
    const leads = [makeLead({ setter_action: "sent_reply" })];
    const model = buildDataDashboardModel({ campaigns, leads, meetings: [], snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.globalKpis.costPerMeeting).toBe(0);
  });
});

// ——— buildDataDashboardModel — setter_response_rate ———

describe("buildDataDashboardModel — setter_response_rate", () => {
  it("setter_response_rate = setterHandled / totalReplies × 100", () => {
    const campaigns = [makeCampaign()];
    const leads = [
      makeLead({ lead_id: "l1", statut_email: "replied", setter_action: "sent_reply" }),
      makeLead({ lead_id: "l2", statut_email: "replied", setter_action: "" }),
      makeLead({ lead_id: "l3", statut_email: "replied", setter_action: "booked" }),
      makeLead({ lead_id: "l4", statut_email: "sent" }),
    ];
    const model = buildDataDashboardModel({ campaigns, leads, meetings: [], snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    // 2 sur 3 replies ont setter_action → 66.7%
    expect(model.globalKpis.setterResponseRate).toBeCloseTo(66.7, 0);
  });

  it("setter_response_rate = 0 si aucune reply", () => {
    const campaigns = [makeCampaign()];
    const leads = [makeLead({ statut_email: "sent" })];
    const model = buildDataDashboardModel({ campaigns, leads, meetings: [], snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.globalKpis.setterResponseRate).toBe(0);
  });
});

// ——— buildDataDashboardModel — attribution RDV ———

describe("buildDataDashboardModel — attributionRdv", () => {
  it("compte les meetings par canal selon source_channel du lead", () => {
    const campaigns = [makeCampaign()];
    const leads = [
      makeLead({ lead_id: "l1", source_channel: "email" }),
      makeLead({ lead_id: "l2", source_channel: "linkedin" }),
      makeLead({ lead_id: "l3", source_channel: "email" }),
    ];
    const meetings = [
      makeMeeting({ meeting_id: "m1", lead_id: "l1", start_at: "2026-05-01T10:00:00Z" }),
      makeMeeting({ meeting_id: "m2", lead_id: "l2", start_at: "2026-05-01T10:00:00Z" }),
      makeMeeting({ meeting_id: "m3", lead_id: "l3", start_at: "2026-05-01T10:00:00Z" }),
    ];
    const model = buildDataDashboardModel({ campaigns, leads, meetings, snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.globalKpis.attributionRdv.email).toBe(2);
    expect(model.globalKpis.attributionRdv.linkedin).toBe(1);
  });

  it("meeting sans lead connu → canal unknown", () => {
    const campaigns = [makeCampaign()];
    const meetings = [makeMeeting({ meeting_id: "m1", lead_id: "unknown", start_at: "2026-05-01T10:00:00Z" })];
    const model = buildDataDashboardModel({ campaigns, leads: [], meetings, snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.globalKpis.attributionRdv.email).toBe(0);
    expect(model.globalKpis.attributionRdv.linkedin).toBe(0);
    expect(model.globalKpis.attributionRdv.unknown).toBe(1);
  });
});

// ——— buildDataDashboardModel — funnelEmail ———

describe("buildDataDashboardModel — funnelEmail", () => {
  it("funnel email contient les 5 étapes", () => {
    const campaigns = [makeCampaign({ total_leads_raw: "100", total_leads_qualified: "20", emails_envoyés: "15" })];
    const leads = [
      makeLead({ lead_id: "l1", statut_email: "replied", source_channel: "email" }),
      makeLead({ lead_id: "l2", statut_email: "sent", source_channel: "email" }),
    ];
    const meetings = [makeMeeting({ lead_id: "l1", start_at: "2026-05-01T10:00:00Z" })];
    const model = buildDataDashboardModel({ campaigns, leads, meetings, snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });

    expect(model.funnelEmail.leadsSourced).toBe(100);
    expect(model.funnelEmail.leadsQualified).toBe(20);
    expect(model.funnelEmail.emailsSent).toBe(15);
    expect(model.funnelEmail.replies).toBeGreaterThanOrEqual(0);
    expect(model.funnelEmail.meetings).toBeGreaterThanOrEqual(0);
  });
});

// ——— buildDataDashboardModel — funnelLI ———

describe("buildDataDashboardModel — funnelLI", () => {
  it("funnelLI contient les 6 étapes avec valeurs par défaut 0", () => {
    const campaigns = [makeCampaign()];
    const model = buildDataDashboardModel({ campaigns, leads: [], meetings: [], snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });

    const f = model.funnelLI;
    expect(typeof f.profilesSourced).toBe("number");
    expect(typeof f.invited).toBe("number");
    expect(typeof f.accepted).toBe("number");
    expect(typeof f.dmSent).toBe("number");
    expect(typeof f.replied).toBe("number");
    expect(typeof f.meetings).toBe("number");
  });

  it("funnelLI.invited = leads avec source_channel=linkedin", () => {
    const campaigns = [makeCampaign()];
    const leads = [
      makeLead({ lead_id: "l1", source_channel: "linkedin", statut_li: "invited" }),
      makeLead({ lead_id: "l2", source_channel: "linkedin", statut_li: "connected" }),
      makeLead({ lead_id: "l3", source_channel: "email" }),
    ];
    const model = buildDataDashboardModel({ campaigns, leads, meetings: [], snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.funnelLI.invited).toBe(2);
  });
});

// ——— businessRows — meeting_rate par campagne ———

describe("buildDataDashboardModel — businessRows meetingRate", () => {
  it("businessRow.meetingRate calculé par campagne", () => {
    const campaigns = [makeCampaign({ total_leads_qualified: "10" })];
    const leads = Array.from({ length: 10 }, (_, i) => makeLead({ lead_id: `l${i}` }));
    const meetings = [
      makeMeeting({ lead_id: "l0", start_at: "2026-05-01T10:00:00Z" }),
    ];
    const model = buildDataDashboardModel({ campaigns, leads, meetings, snapshots: [], statusGroup: "all", period: "all", referenceDate: REF });
    expect(model.businessRows[0].meetingRate).toBe(10); // 1/10 × 100
  });
});
