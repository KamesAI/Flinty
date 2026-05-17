import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHILD_MEETINGS_HEADER,
  pollCalendlyBookings,
  processCalendlyEvent,
  resolveLeadByInviteeEmail,
} from "./calendly-poll";
import {
  appendToChildSheet,
  readChildQualifiedLeads,
  readChildSheet,
  readIndex,
  updateChildSheetValues,
} from "./sheets";
import { fetchCalendlyEventInvitees, fetchCalendlyScheduledEvents } from "./calendly";

vi.mock("./calendly", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./calendly")>();
  return {
    ...actual,
    fetchCalendlyEventInvitees: vi.fn(),
    fetchCalendlyScheduledEvents: vi.fn(),
  };
});

vi.mock("./sheets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sheets")>();
  return {
    ...actual,
    appendToChildSheet: vi.fn(),
    getSheets: vi.fn(),
    readChildQualifiedLeads: vi.fn(),
    readChildSheet: vi.fn(),
    readIndex: vi.fn(),
    updateChildSheetValues: vi.fn(),
  };
});

const INDEX_HEADER = [
  "campaign_id",
  "nom",
  "sheet_id",
  "sheet_url",
  "secteur",
  "localisation",
  "offre_kames",
  "statut",
  "date_creation",
  "total_leads_raw",
  "total_leads_qualified",
  "emails_envoyes",
  "taux_reponse",
];

const QUALIFIED_HEADER = [
  "lead_id",
  "campaign_id",
  "nom",
  "site",
  "ville",
  "score",
  "score_reason",
  "email",
  "telephone",
  "prenom",
  "poste",
  "secteur",
  "taille_equipe",
  "has_ia_services",
  "hiring_signals",
  "growth_stage",
  "buying_signal",
  "personalized_hook",
  "statut_email",
  "web_quality_score",
  "web_quality_signals",
  "societe",
  "prenom_gerant",
  "nom_gerant",
  "email_gerant",
];

const EVENT = {
  uri: "https://api.calendly.com/scheduled_events/event-123",
  name: "30 Minute Meeting",
  start_time: "2026-05-18T09:00:00.000000Z",
  end_time: "2026-05-18T09:30:00.000000Z",
  event_type: "https://api.calendly.com/event_types/type-1",
};

describe("calendly polling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readIndex).mockResolvedValue([
      INDEX_HEADER,
      [
        "cmp_active",
        "Campagne active",
        "child-sheet-1",
        "",
        "",
        "",
        "",
        "active",
        "2026-05-17",
        "0",
        "0",
        "0",
        "0",
      ],
    ]);
    vi.mocked(readChildQualifiedLeads).mockResolvedValue([
      QUALIFIED_HEADER,
      [
        "lead_123",
        "cmp_active",
        "Dupont",
        "",
        "",
        "",
        "",
        "fallback@example.com",
        "",
        "Camille",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "replied",
        "",
        "",
        "",
        "",
        "",
        "prospect@example.com",
      ],
    ]);
    vi.mocked(readChildSheet).mockResolvedValue([CHILD_MEETINGS_HEADER]);
  });

  it("résout un lead actif via email invitee sans exposer la PII", async () => {
    const match = await resolveLeadByInviteeEmail("Prospect@Example.com");

    expect(match).toEqual({
      campaignId: "cmp_active",
      leadId: "lead_123",
      leadRowNumber: 2,
      qualifiedTabName: "Leads_Qualified",
      sheetId: "child-sheet-1",
      statusColumnLetter: "S",
    });
  });

  it("écrit un nouveau meeting et passe le lead en booked", async () => {
    const result = await processCalendlyEvent(EVENT, {
      email: "prospect@example.com",
      name: "Camille Dupont",
    });

    expect(result).toEqual({ status: "created", meetingId: "event-123" });
    expect(appendToChildSheet).toHaveBeenCalledWith(
      "child-sheet-1",
      "Meetings!A:G",
      [
        "event-123",
        "lead_123",
        "https://api.calendly.com/scheduled_events/event-123",
        "2026-05-18T09:00:00.000000Z",
        "https://api.calendly.com/event_types/type-1",
        "setter",
        "booked",
      ]
    );
    expect(updateChildSheetValues).toHaveBeenCalledWith(
      "child-sheet-1",
      "'Leads_Qualified'!S2",
      [["booked"]]
    );
  });

  it("ne réécrit pas un event Calendly déjà présent", async () => {
    vi.mocked(readChildSheet).mockResolvedValueOnce([
      CHILD_MEETINGS_HEADER,
      [
        "event-123",
        "lead_123",
        "https://api.calendly.com/scheduled_events/event-123",
        "2026-05-18T09:00:00.000000Z",
        "type",
        "setter",
        "booked",
      ],
    ]);

    const result = await processCalendlyEvent(EVENT, {
      email: "prospect@example.com",
      name: "Camille Dupont",
    });

    expect(result).toEqual({ status: "skipped_existing", meetingId: "event-123" });
    expect(appendToChildSheet).not.toHaveBeenCalled();
    expect(updateChildSheetValues).not.toHaveBeenCalled();
  });

  it("termine sans erreur quand Calendly ne retourne aucun event", async () => {
    vi.mocked(fetchCalendlyScheduledEvents).mockResolvedValue([]);

    const result = await pollCalendlyBookings(new Date("2026-05-17T12:00:00.000Z"));

    expect(result).toEqual({
      events: 0,
      invitees: 0,
      created: 0,
      skipped_existing: 0,
      skipped_unmatched: 0,
    });
    expect(fetchCalendlyEventInvitees).not.toHaveBeenCalled();
    expect(appendToChildSheet).not.toHaveBeenCalled();
  });

  it("récupère les invitees pour chaque event récent", async () => {
    vi.mocked(fetchCalendlyScheduledEvents).mockResolvedValue([EVENT]);
    vi.mocked(fetchCalendlyEventInvitees).mockResolvedValue([
      { email: "prospect@example.com", name: "Camille Dupont" },
    ]);

    const result = await pollCalendlyBookings(new Date("2026-05-17T12:00:00.000Z"));

    expect(result.created).toBe(1);
    expect(fetchCalendlyScheduledEvents).toHaveBeenCalledWith(
      new Date("2026-05-17T11:50:00.000Z"),
      new Date("2026-06-16T12:00:00.000Z")
    );
    expect(fetchCalendlyEventInvitees).toHaveBeenCalledWith(EVENT.uri);
  });
});
