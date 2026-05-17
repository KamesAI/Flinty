import {
  fetchCalendlyEventInvitees,
  fetchCalendlyScheduledEvents,
  extractCalendlyId,
  type CalendlyInvitee,
  type CalendlyScheduledEvent,
} from "./calendly";
import {
  QUALIFIED_SHEET_RANGE_WITH_HEADER,
  appendToChildSheet,
  childSheetA1Range,
  getSheets,
  isUnableToParseRangeError,
  parseIndexCampaigns,
  readChildQualifiedLeads,
  readChildSheet,
  readIndex,
  updateChildSheetValues,
} from "./sheets";

export const CHILD_MEETINGS_HEADER = [
  "meeting_id",
  "lead_id",
  "calendly_uri",
  "start_at",
  "event_type",
  "booked_via",
  "status",
] as const;

export interface LeadMatch {
  sheetId: string;
  campaignId: string;
  leadId: string;
  leadRowNumber: number;
  qualifiedTabName: string;
  statusColumnLetter: string;
}

export interface CalendlyPollSummary {
  events: number;
  invitees: number;
  created: number;
  skipped_existing: number;
  skipped_unmatched: number;
}

type ProcessBookingResult =
  | { status: "created"; meetingId: string }
  | { status: "skipped_existing"; meetingId: string }
  | { status: "skipped_unmatched"; meetingId: string };

function getColumnLetter(columnNumber: number) {
  let dividend = columnNumber;
  let columnName = "";

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getHeaderIndex(header: string[], names: string[]) {
  return names
    .map((name) => header.findIndex((column) => column.trim().toLowerCase() === name))
    .find((index) => index !== undefined && index >= 0) ?? -1;
}

function getQualifiedTabName(campaignId: string, rows: string[][]) {
  return rows[0]?.some((column) => column === "lead_id") ? "Leads_Qualified" : `${campaignId}_Qualified`;
}

export async function resolveLeadByInviteeEmail(email: string): Promise<LeadMatch | null> {
  const targetEmail = normalizeEmail(email);
  const campaigns = parseIndexCampaigns(await readIndex()).filter(
    (campaign) => campaign.statut === "active" && campaign.sheet_id
  );

  for (const campaign of campaigns) {
    const rows = await readChildQualifiedLeads(
      campaign.sheet_id,
      campaign.campaign_id,
      QUALIFIED_SHEET_RANGE_WITH_HEADER
    );
    const header = rows[0] ?? [];
    const leadIdIndex = getHeaderIndex(header, ["lead_id"]);
    const emailIndexes = ["email_gerant", "email"]
      .map((name) => header.findIndex((column) => column.trim().toLowerCase() === name))
      .filter((index) => index >= 0);
    const statusIndex = getHeaderIndex(header, ["statut", "statut_email"]);

    if (leadIdIndex < 0 || emailIndexes.length === 0 || statusIndex < 0) continue;

    const rowIndex = rows.findIndex((row, index) => {
      if (index === 0) return false;
      return emailIndexes.some((emailIndex) => normalizeEmail(row[emailIndex] ?? "") === targetEmail);
    });

    if (rowIndex >= 1) {
      return {
        sheetId: campaign.sheet_id,
        campaignId: campaign.campaign_id,
        leadId: rows[rowIndex][leadIdIndex] ?? "",
        leadRowNumber: rowIndex + 1,
        qualifiedTabName: getQualifiedTabName(campaign.campaign_id, rows),
        statusColumnLetter: getColumnLetter(statusIndex + 1),
      };
    }
  }

  return null;
}

async function ensureChildMeetingsSheet(spreadsheetId: string) {
  try {
    const rows = await readChildSheet(spreadsheetId, "Meetings!A1:G1");
    const currentHeader = rows[0] ?? [];
    if (
      currentHeader.length === CHILD_MEETINGS_HEADER.length &&
      CHILD_MEETINGS_HEADER.every((column, index) => currentHeader[index] === column)
    ) {
      return;
    }
  } catch (error) {
    if (!isUnableToParseRangeError(error)) throw error;
    const sheets = await getSheets();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Meetings" } } }],
      },
    });
  }

  await updateChildSheetValues(spreadsheetId, "Meetings!A1:G1", [[...CHILD_MEETINGS_HEADER]]);
}

async function hasCalendlyMeeting(spreadsheetId: string, calendlyUri: string) {
  try {
    const rows = await readChildSheet(spreadsheetId, "Meetings!A:G");
    const header = rows[0] ?? [];
    const calendlyUriIndex = getHeaderIndex(header, ["calendly_uri", "booking_url"]);
    if (calendlyUriIndex < 0) return false;

    return rows
      .slice(1)
      .some((row) => (row[calendlyUriIndex] ?? "").trim() === calendlyUri);
  } catch (error) {
    if (isUnableToParseRangeError(error)) return false;
    throw error;
  }
}

export async function processCalendlyEvent(
  event: CalendlyScheduledEvent,
  invitee: CalendlyInvitee
): Promise<ProcessBookingResult> {
  const meetingId = extractCalendlyId(event.uri);
  const match = await resolveLeadByInviteeEmail(invitee.email);
  if (!match) return { status: "skipped_unmatched", meetingId };

  if (await hasCalendlyMeeting(match.sheetId, event.uri)) {
    return { status: "skipped_existing", meetingId };
  }

  await ensureChildMeetingsSheet(match.sheetId);
  await appendToChildSheet(match.sheetId, "Meetings!A:G", [
    meetingId,
    match.leadId,
    event.uri,
    event.start_time,
    event.event_type ?? event.name ?? "",
    "setter",
    "booked",
  ]);

  await updateChildSheetValues(
    match.sheetId,
    childSheetA1Range(match.qualifiedTabName, `${match.statusColumnLetter}${match.leadRowNumber}`),
    [["booked"]]
  );

  return { status: "created", meetingId };
}

export async function pollCalendlyBookings(now = new Date()): Promise<CalendlyPollSummary> {
  const minStartTime = new Date(now.getTime() - 10 * 60 * 1000);
  const maxStartTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const events = await fetchCalendlyScheduledEvents(minStartTime, maxStartTime);
  const summary: CalendlyPollSummary = {
    events: events.length,
    invitees: 0,
    created: 0,
    skipped_existing: 0,
    skipped_unmatched: 0,
  };

  for (const event of events) {
    const invitees = await fetchCalendlyEventInvitees(event.uri);
    summary.invitees += invitees.length;

    for (const invitee of invitees) {
      const result = await processCalendlyEvent(event, invitee);
      summary[result.status] += 1;
    }
  }

  return summary;
}
