import { google } from "googleapis";
import {
  ANALYTICS_DAILY_HEADER,
  ANALYTICS_DAILY_SHEET_NAME,
  parseAnalyticsDailyRows,
  type AnalyticsDailySnapshot,
} from "@/lib/analytics";
import {
  EMAIL_EVENTS_HEADER,
  EMAIL_EVENTS_SHEET_NAME,
  parseEmailEventRows,
  type EmailEvent,
} from "@/lib/email-events";
import {
  EMAIL_TEMPLATES_HEADER,
  EMAIL_TEMPLATES_SHEET_NAME,
  mergeCampaignEmailTemplates,
  type CampaignEmailTemplates,
  type EmailTemplateEntry,
  type EmailTemplateEntryInput,
  normalizeEmailTemplateEntry,
  normalizeTemplateEntryInput,
} from "@/lib/email-templates";
import {
  MEETINGS_HEADER,
  MEETINGS_SHEET_NAME,
  parseMeetingRows,
  type Meeting,
} from "@/lib/meetings";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function getSheets() {
  const auth = await getAuth().getClient();
  return google.sheets({ version: "v4", auth: auth as never });
}

export async function getSheetData(range: string) {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return response.data.values ?? [];
}

export async function appendRow(range: string, values: string[]) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function updateRow(range: string, values: string[]) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

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

async function ensureSheetExists(title: string, header: readonly string[]) {
  const sheets = await getSheets();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const sheetExists = spreadsheet.data.sheets?.some(
    (sheet) => sheet.properties?.title === title
  );

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
  }

  const lastColumn = getColumnLetter(header.length);
  const headerRange = `${title}!A1:${lastColumn}1`;
  const headerRows = await getSheetData(headerRange).catch(() => []);
  const currentHeader = headerRows[0] ?? [];
  const needsHeader =
    currentHeader.length !== header.length ||
    header.some((column, index) => currentHeader[index] !== column);

  if (needsHeader) {
    await updateRow(headerRange, [...header]);
  }
}

export async function ensureEmailTemplatesSheet() {
  await ensureSheetExists(EMAIL_TEMPLATES_SHEET_NAME, EMAIL_TEMPLATES_HEADER);
}

export async function ensureMeetingsSheet() {
  await ensureSheetExists(MEETINGS_SHEET_NAME, MEETINGS_HEADER);
}

export async function ensureAnalyticsDailySheet() {
  await ensureSheetExists(ANALYTICS_DAILY_SHEET_NAME, ANALYTICS_DAILY_HEADER);
}

export async function ensureEmailEventsSheet() {
  await ensureSheetExists(EMAIL_EVENTS_SHEET_NAME, EMAIL_EVENTS_HEADER);
}

// ——— Types ———

export interface Campaign {
  campaign_id: string;
  nom: string;
  secteur: string;
  localisation: string;
  date_création: string;
  offre_kames: string;
  statut: "active" | "generating" | "scheduled" | "paused" | "completed" | "archived";
  total_leads_raw: string;
  total_leads_qualified: string;
  emails_envoyés: string;
  taux_ouverture: string;
  taux_réponse: string;
}

export interface Lead {
  lead_id: string;
  campaign_id: string;
  nom: string;
  prénom: string;
  poste: string;
  secteur: string;
  email: string;
  téléphone: string;
  score: string;
  site: string;
  ville: string;
  taille_equipe: string;
  has_ia_services: string;
  statut_email: string;
  resend_email_id: string;
  last_email_sent_at?: string;
}

// ——— Parsers ———

export function parseCampaigns(rows: string[][]): Campaign[] {
  if (!rows.length) return [];
  const [, ...data] = rows; // skip header
  return data.map((r) => ({
    campaign_id: r[0] ?? "",
    nom: r[1] ?? "",
    secteur: r[2] ?? "",
    localisation: r[3] ?? "",
    date_création: r[4] ?? "",
    offre_kames: r[5] ?? "",
    statut: (r[6] as Campaign["statut"]) ?? "paused",
    total_leads_raw: r[7] ?? "0",
    total_leads_qualified: r[8] ?? "0",
    emails_envoyés: r[9] ?? "0",
    taux_ouverture: r[10] ?? "0",
    taux_réponse: r[11] ?? "0",
  }));
}

export function parseLeads(rows: string[][]): Lead[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data.map((r) => ({
    lead_id:         r[0]  ?? "",
    campaign_id:     r[1]  ?? "",
    nom:             r[2]  ?? "",
    prénom:          r[3]  ?? "",
    poste:           r[4]  ?? "",
    secteur:         r[5]  ?? "",
    email:           r[6]  ?? "",
    téléphone:       r[7]  ?? "",
    score:           r[8]  ?? "0",
    site:            r[9]  ?? "",
    ville:           r[10] ?? "",
    taille_equipe:   r[11] ?? "",
    has_ia_services: r[12] ?? "",
    statut_email:    r[13] ?? "new",
    resend_email_id: r[14] ?? "",
    last_email_sent_at: r[15],
  }));
}

export function parseEmailTemplateEntries(rows: string[][]): EmailTemplateEntry[] {
  if (!rows.length) return [];

  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim().length > 0)
    .map((r) =>
      normalizeEmailTemplateEntry({
        campaign_id: r[0] ?? "",
        sequence_key: (r[1] ?? "j0") as EmailTemplateEntry["sequence_key"],
        variant_key: (r[2] ?? "default") as EmailTemplateEntry["variant_key"],
        label: r[3] ?? "",
        subject: r[4] ?? "",
        body: r[5] ?? "",
        preview_text: r[6] ?? "",
        cta_label: r[7] ?? "",
        cta_url: r[8] ?? "",
        media_type: (r[9] ?? "none") as EmailTemplateEntry["media_type"],
        media_thumbnail_url: r[10] ?? "",
        media_target_url: r[11] ?? "",
        is_rich_template: (r[12] ?? "").toLowerCase() === "true",
        notes: r[13] ?? "",
        updated_at: r[14] ?? "",
      })
    );
}

export function parseMeetings(rows: string[][]): Meeting[] {
  return parseMeetingRows(rows);
}

export function parseAnalyticsDaily(rows: string[][]): AnalyticsDailySnapshot[] {
  return parseAnalyticsDailyRows(rows);
}

export async function getCampaignEmailTemplates(
  campaignId: string
): Promise<CampaignEmailTemplates> {
  await ensureEmailTemplatesSheet();
  const lastColumn = getColumnLetter(EMAIL_TEMPLATES_HEADER.length);
  const rows = await getSheetData(`${EMAIL_TEMPLATES_SHEET_NAME}!A:${lastColumn}`);
  const entries = parseEmailTemplateEntries(rows).filter(
    (entry) => entry.campaign_id === campaignId
  );

  return mergeCampaignEmailTemplates(campaignId, entries);
}

export async function saveCampaignEmailTemplates(
  campaignId: string,
  entries: EmailTemplateEntryInput[]
) {
  await ensureEmailTemplatesSheet();

  const lastColumn = getColumnLetter(EMAIL_TEMPLATES_HEADER.length);
  const rows = await getSheetData(`${EMAIL_TEMPLATES_SHEET_NAME}!A:${lastColumn}`);
  const existingEntries = parseEmailTemplateEntries(rows);
  const timestamp = new Date().toISOString();

  for (const entry of entries) {
    const normalizedEntry = normalizeTemplateEntryInput(entry);
    const rowIndex = existingEntries.findIndex(
      (candidate) =>
        candidate.campaign_id === campaignId &&
        candidate.sequence_key === normalizedEntry.sequence_key &&
        candidate.variant_key === normalizedEntry.variant_key
    );

    const values = [
      campaignId,
      normalizedEntry.sequence_key,
      normalizedEntry.variant_key,
      normalizedEntry.label,
      normalizedEntry.subject,
      normalizedEntry.body,
      normalizedEntry.preview_text ?? "",
      normalizedEntry.cta_label ?? "",
      normalizedEntry.cta_url ?? "",
      normalizedEntry.media_type ?? "none",
      normalizedEntry.media_thumbnail_url ?? "",
      normalizedEntry.media_target_url ?? "",
      String(normalizedEntry.is_rich_template ?? false),
      normalizedEntry.notes ?? "",
      timestamp,
    ];

    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await updateRow(
        `${EMAIL_TEMPLATES_SHEET_NAME}!A${rowNumber}:${lastColumn}${rowNumber}`,
        values
      );
    } else {
      await appendRow(`${EMAIL_TEMPLATES_SHEET_NAME}!A:${lastColumn}`, values);
      existingEntries.push(
        normalizeEmailTemplateEntry({
        campaign_id: campaignId,
          sequence_key: normalizedEntry.sequence_key,
          variant_key: normalizedEntry.variant_key,
          label: normalizedEntry.label,
          subject: normalizedEntry.subject,
          body: normalizedEntry.body,
          preview_text: normalizedEntry.preview_text,
          cta_label: normalizedEntry.cta_label,
          cta_url: normalizedEntry.cta_url,
          media_type: normalizedEntry.media_type,
          media_thumbnail_url: normalizedEntry.media_thumbnail_url,
          media_target_url: normalizedEntry.media_target_url,
          is_rich_template: normalizedEntry.is_rich_template,
          notes: normalizedEntry.notes,
          updated_at: timestamp,
        })
      );
    }
  }

  return getCampaignEmailTemplates(campaignId);
}

export async function getMeetings() {
  await ensureMeetingsSheet();
  const lastColumn = getColumnLetter(MEETINGS_HEADER.length);
  const rows = await getSheetData(`${MEETINGS_SHEET_NAME}!A:${lastColumn}`);
  return parseMeetings(rows);
}

export async function getLeadMeetings(leadId: string): Promise<Meeting[]> {
  await ensureMeetingsSheet();
  const lastColumn = getColumnLetter(MEETINGS_HEADER.length);
  const rows = await getSheetData(`${MEETINGS_SHEET_NAME}!A:${lastColumn}`);
  return parseMeetings(rows)
    .filter((m) => m.lead_id === leadId)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
}

export async function getAnalyticsDailySnapshots() {
  await ensureAnalyticsDailySheet();
  const lastColumn = getColumnLetter(ANALYTICS_DAILY_HEADER.length);
  const rows = await getSheetData(`${ANALYTICS_DAILY_SHEET_NAME}!A:${lastColumn}`);
  return parseAnalyticsDaily(rows);
}

export async function getLeadEmailEvents(leadId: string): Promise<EmailEvent[]> {
  await ensureEmailEventsSheet();
  const lastColumn = getColumnLetter(EMAIL_EVENTS_HEADER.length);
  const rows = await getSheetData(`${EMAIL_EVENTS_SHEET_NAME}!A:${lastColumn}`);
  return parseEmailEventRows(rows)
    .filter((e) => e.lead_id === leadId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function getAllEmailEvents(): Promise<EmailEvent[]> {
  await ensureEmailEventsSheet();
  const lastColumn = getColumnLetter(EMAIL_EVENTS_HEADER.length);
  const rows = await getSheetData(`${EMAIL_EVENTS_SHEET_NAME}!A:${lastColumn}`);
  return parseEmailEventRows(rows)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export { type EmailEvent };
