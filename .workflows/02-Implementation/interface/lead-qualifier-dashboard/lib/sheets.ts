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
import {
  EMAIL_HEALTH_HEADER,
  EMAIL_HEALTH_SHEET_NAME,
  parseEmailHealthRows,
  type EmailHealthRow,
} from "@/lib/pacing";
import {
  COST_TRACKING_HEADER,
  COST_TRACKING_SHEET_NAME,
  costTrackingRowFromUsage,
  parseCostTrackingRows,
  type CostTrackingRow,
  type TokenUsage,
} from "@/lib/cost-monitoring";

const SPREADSHEET_ID = process.env.GOOGLE_INDEX_SHEET_ID!;

/**
 * Onglet `*_Qualified` (27 colonnes A–AA lues, +1 col AB ignorée).
 * Ne pas se terminer par `AA` + numéro de ligne à plusieurs chiffres (`AA5000`) : l’API Sheets
 * renvoie « Unable to parse range » (ambiguïté A1). Utiliser `AB` comme colonne de fin.
 */
export const QUALIFIED_SHEET_RANGE_WITH_HEADER = "A1:AB5000";
/** Données sans ligne d’en-tête (parsers qui mapent toutes les lignes). */
export const QUALIFIED_SHEET_RANGE_DATA_ROWS = "A2:AB5000";

const SHEET_READ_CACHE_TTL_MS = 15_000;
const SHEET_ENSURE_CACHE_TTL_MS = 5 * 60_000;

type SheetRows = string[][];
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const sheetDataCache = new Map<string, CacheEntry<SheetRows>>();
const inFlightSheetReads = new Map<string, Promise<SheetRows>>();
const ensuredSheetsCache = new Map<string, number>();
let spreadsheetTitlesCache: CacheEntry<Set<string>> | null = null;
let inFlightSpreadsheetTitles: Promise<Set<string>> | null = null;

function isCacheFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

function cloneSheetRows(rows: SheetRows): SheetRows {
  return rows.map((row) => [...row]);
}

function invalidateSheetReadCaches() {
  sheetDataCache.clear();
  inFlightSheetReads.clear();
  spreadsheetTitlesCache = null;
  inFlightSpreadsheetTitles = null;
}

async function getSpreadsheetTitles() {
  if (spreadsheetTitlesCache && isCacheFresh(spreadsheetTitlesCache.expiresAt)) {
    return new Set(spreadsheetTitlesCache.value);
  }

  if (inFlightSpreadsheetTitles) {
    return new Set(await inFlightSpreadsheetTitles);
  }

  const request = (async () => {
    const sheets = await getSheets();
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: "sheets.properties.title",
    });

    const titles = new Set(
      (spreadsheet.data.sheets ?? [])
        .map((sheet) => sheet.properties?.title)
        .filter((title): title is string => Boolean(title))
    );

    spreadsheetTitlesCache = {
      value: titles,
      expiresAt: Date.now() + SHEET_ENSURE_CACHE_TTL_MS,
    };

    return titles;
  })();

  inFlightSpreadsheetTitles = request;

  try {
    return new Set(await request);
  } finally {
    inFlightSpreadsheetTitles = null;
  }
}

function hasUserOAuthCredentials() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
}

function hasServiceAccountCredentials() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

type GoogleAuthMode = "oauth" | "service_account";

function getGoogleAuthMode(): GoogleAuthMode {
  const forcedMode = process.env.GOOGLE_AUTH_MODE?.trim().toLowerCase();
  if (forcedMode === "oauth" && hasUserOAuthCredentials()) return "oauth";
  if (forcedMode === "service_account" && hasServiceAccountCredentials()) {
    return "service_account";
  }
  if (hasServiceAccountCredentials()) return "service_account";
  if (hasUserOAuthCredentials()) return "oauth";
  throw new Error(
    "Google auth is not configured: set GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY or GOOGLE_OAUTH_*"
  );
}

function isUsingUserOAuth() {
  return getGoogleAuthMode() === "oauth";
}

async function getServiceAccountAuthClient() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  }).getClient();
}

async function getUserOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });
  return oauth2Client;
}

async function getAuthClient() {
  return getGoogleAuthMode() === "oauth"
    ? getUserOAuthClient()
    : getServiceAccountAuthClient();
}

export async function getSheets() {
  const auth = await getAuthClient();
  return google.sheets({ version: "v4", auth: auth as never });
}

export async function getDrive() {
  const auth = await getAuthClient();
  return google.drive({ version: "v3", auth: auth as never });
}

export async function getSheetData(range: string) {
  const cachedRows = sheetDataCache.get(range);
  if (cachedRows && isCacheFresh(cachedRows.expiresAt)) {
    return cloneSheetRows(cachedRows.value);
  }

  const inFlightRequest = inFlightSheetReads.get(range);
  if (inFlightRequest) {
    return cloneSheetRows(await inFlightRequest);
  }

  const request = (async () => {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
    const rows = (response.data.values ?? []) as SheetRows;

    sheetDataCache.set(range, {
      value: cloneSheetRows(rows),
      expiresAt: Date.now() + SHEET_READ_CACHE_TTL_MS,
    });

    return rows;
  })();

  inFlightSheetReads.set(range, request);

  try {
    return cloneSheetRows(await request);
  } finally {
    inFlightSheetReads.delete(range);
  }
}

export async function appendRow(range: string, values: string[]) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  invalidateSheetReadCaches();
}

export async function updateRow(range: string, values: string[]) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  invalidateSheetReadCaches();
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
  const ensuredUntil = ensuredSheetsCache.get(title);
  if (ensuredUntil && isCacheFresh(ensuredUntil)) {
    return;
  }

  const sheetTitles = await getSpreadsheetTitles();
  const sheetExists = sheetTitles.has(title);

  if (!sheetExists) {
    const sheets = await getSheets();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
    invalidateSheetReadCaches();
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

  ensuredSheetsCache.set(title, Date.now() + SHEET_ENSURE_CACHE_TTL_MS);
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

export async function ensureEmailHealthSheet() {
  await ensureSheetExists(EMAIL_HEALTH_SHEET_NAME, EMAIL_HEALTH_HEADER);
}

export async function ensureCostTrackingSheet() {
  await ensureSheetExists(COST_TRACKING_SHEET_NAME, COST_TRACKING_HEADER);
}

export async function ensureGlobalConfigSheet() {
  await ensureSheetExists("Config", ["param_key", "param_value", "description"]);
  const rows = await getSheetData("Config!A:B");
  const hasThreshold = rows.some((row, index) => index > 0 && row[0] === "alert_cost_per_meeting_threshold");
  if (!hasThreshold) {
    await appendRow("Config!A:C", [
      "alert_cost_per_meeting_threshold",
      "15",
      "Seuil d'alerte coût par meeting en USD",
    ]);
  }
}

/** Ajoute une ligne dans un GSheet enfant (spreadsheetId = fichier campagne). */
export async function appendToChildSheet(
  spreadsheetId: string,
  range: string,
  values: string[]
): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
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
  workspace_id: string;
  // v4 KPI (from WF6, may be empty before first run)
  connection_rate_li?: string;
  setter_response_rate?: string;
  meeting_rate?: string;
  cost_per_meeting?: string;
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
  // v4 fields
  source_channel?: string;
  statut_li?: string;
  setter_action?: string;
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
    workspace_id: r[12] || "kames-default",
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

export async function getEmailHealthRows(): Promise<EmailHealthRow[]> {
  await ensureEmailHealthSheet();
  const lastColumn = getColumnLetter(EMAIL_HEALTH_HEADER.length);
  const rows = await getSheetData(`${EMAIL_HEALTH_SHEET_NAME}!A:${lastColumn}`);
  return parseEmailHealthRows(rows);
}

export async function getEmailHealth(domain = "outreach.kamesai.com"): Promise<EmailHealthRow | null> {
  const rows = await getEmailHealthRows();
  return rows.find((row) => row.domain === domain) ?? null;
}

export async function getCostTrackingRows(): Promise<CostTrackingRow[]> {
  await ensureCostTrackingSheet();
  const lastColumn = getColumnLetter(COST_TRACKING_HEADER.length);
  const rows = await getSheetData(`${COST_TRACKING_SHEET_NAME}!A:${lastColumn}`);
  return parseCostTrackingRows(rows);
}

export async function appendCostTrackingUsage(input: {
  campaignId: string;
  usage: TokenUsage;
  unipileActions?: number;
  calendlyCalls?: number;
}): Promise<void> {
  await ensureCostTrackingSheet();
  const lastColumn = getColumnLetter(COST_TRACKING_HEADER.length);
  await appendRow(
    `${COST_TRACKING_SHEET_NAME}!A:${lastColumn}`,
    costTrackingRowFromUsage(input)
  );
}

export async function getGlobalConfig(): Promise<Record<string, string>> {
  await ensureGlobalConfigSheet();
  const rows = await getSheetData("Config!A:B");
  const [, ...data] = rows;
  return Object.fromEntries(
    data
      .filter((row) => (row[0] ?? "").trim())
      .map((row) => [row[0] ?? "", row[1] ?? ""])
  );
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

/** Parse les lignes d'un onglet {campaign_id}_Qualified (schéma v4, 32 colonnes A:AF). */
export function parseLeadsV3(rows: string[][]): Lead[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => r[0])
    .map((r) => ({
      lead_id:            r[0]  ?? "",
      campaign_id:        r[1]  ?? "",
      nom:                r[21] ?? r[2] ?? "",
      prénom:             r[22] ?? r[9] ?? "",
      poste:              r[10] ?? "",
      secteur:            r[11] ?? "",
      email:              r[24] ?? r[7] ?? "",
      téléphone:          r[8]  ?? "",
      score:              r[5]  ?? "0",
      site:               r[3]  ?? "",
      ville:              r[4]  ?? "",
      taille_equipe:      r[12] ?? "",
      has_ia_services:    r[13] ?? "",
      statut_email:       r[18] ?? "new",
      resend_email_id:    "",
      last_email_sent_at: undefined,
      // v4 fields
      source_channel:     r[28] ?? "",
      statut_li:          r[29] ?? "",
      setter_action:      r[31] ?? "",
    }));
}

/** Aggrège les leads qualifiés de toutes les feuilles enfants en parallèle. */
export async function getAllLeadsV3(campaigns: IndexCampaign[]): Promise<Lead[]> {
  const results = await Promise.all(
    campaigns
      .filter((c) => c.sheet_id)
      .map(async (c) => {
        const rows = await readChildQualifiedLeads(
          c.sheet_id,
          c.campaign_id,
          QUALIFIED_SHEET_RANGE_WITH_HEADER
        );
        return parseLeadsV3(rows);
      })
  );
  return results.flat();
}

/** Convertit un IndexCampaign v3/v4 vers Campaign (taux_ouverture absent → "0"). */
export function indexCampaignToCampaign(c: IndexCampaign): Campaign {
  return {
    campaign_id:           c.campaign_id,
    nom:                   c.nom,
    secteur:               c.secteur,
    localisation:          c.localisation,
    date_création:         c.date_création,
    offre_kames:           c.offre_kames,
    statut:                c.statut,
    total_leads_raw:       c.total_leads_raw,
    total_leads_qualified: c.total_leads_qualified,
    emails_envoyés:        c.emails_envoyés,
    taux_ouverture:        "0",
    taux_réponse:          c.taux_réponse,
    workspace_id:          c.workspace_id,
    connection_rate_li:    c.connection_rate_li,
    setter_response_rate:  c.setter_response_rate,
    meeting_rate:          c.meeting_rate,
    cost_per_meeting:      c.cost_per_meeting,
  };
}

// ——— Types v3 Index ———

export interface IndexCampaign {
  campaign_id: string;
  nom: string;
  sheet_id: string;
  sheet_url: string;
  secteur: string;
  localisation: string;
  offre_kames: string;
  statut: "active" | "generating" | "scheduled" | "paused" | "completed" | "archived";
  date_création: string;
  total_leads_raw: string;
  total_leads_qualified: string;
  emails_envoyés: string;
  taux_réponse: string;
  workspace_id: string;
  // v4 — calculées par WF6 toutes les 6h (vides avant premier run WF6)
  connection_rate_li: string;
  setter_response_rate: string;
  meeting_rate: string;
  cost_per_meeting: string;
}

export function parseIndexCampaigns(rows: string[][]): IndexCampaign[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => r[0])
    .map((r) => ({
      campaign_id:           r[0]  ?? "",
      nom:                   r[1]  ?? "",
      sheet_id:              r[2]  ?? "",
      sheet_url:             r[3]  ?? "",
      secteur:               r[4]  ?? "",
      localisation:          r[5]  ?? "",
      offre_kames:           r[6]  ?? "",
      statut:                (r[7] as IndexCampaign["statut"]) ?? "paused",
      date_création:         r[8]  ?? "",
      total_leads_raw:       r[9]  ?? "0",
      total_leads_qualified: r[10] ?? "0",
      emails_envoyés:        r[11] ?? "0",
      taux_réponse:          r[12] ?? "0",
      workspace_id:          r[13] || "kames-default",
      // v4 KPI columns (written by WF6)
      connection_rate_li:    r[14] ?? "",
      setter_response_rate:  r[15] ?? "",
      meeting_rate:          r[16] ?? "",
      cost_per_meeting:      r[17] ?? "",
    }));
}

// ——— Index GSheet (v3 — GOOGLE_INDEX_SHEET_ID) ———

const INDEX_SHEET_ID = process.env.GOOGLE_INDEX_SHEET_ID!;

export const INDEX_CAMPAIGNS_COLUMNS = [
  "campaign_id",
  "nom",
  "sheet_id",
  "sheet_url",
  "secteur",
  "localisation",
  "offre_kames",
  "statut",
  "date_création",
  "total_leads_raw",
  "total_leads_qualified",
  "emails_envoyés",
  "taux_réponse",
  "workspace_id",
  // v4 KPI columns (written by WF6)
  "connection_rate_li",
  "setter_response_rate",
  "meeting_rate",
  "cost_per_meeting",
] as const;

type IndexCampaignColumnName = (typeof INDEX_CAMPAIGNS_COLUMNS)[number];
type IndexCampaignPatch = Partial<Record<IndexCampaignColumnName, string>>;

const INDEX_CAMPAIGNS_RANGE = "Campagnes!A:R";

export const ACCOUNTS_SHEET_NAME = "Accounts";
export const ACCOUNTS_HEADER = [
  "account_id",
  "type",
  "provider",
  "status",
  "connected_at",
  "paused_reason",
  "pause_started_at",
  "workspace_id",
  "access_token",
  "refresh_token",
  "token_expires_at",
] as const;

export interface LinkedInAccountRow {
  account_id: string;
  type: "linkedin";
  provider: "unipile";
  status: "connected" | "expired" | "paused" | "disconnected";
  connected_at: string;
  paused_reason: string;
  pause_started_at: string;
  workspace_id: string;
}

export interface CalendlyAccountRow {
  account_id: string;
  type: "calendly";
  provider: "calendly";
  status: "connected" | "expired" | "disconnected";
  connected_at: string;
  workspace_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

export function parseCalendlyAccountRows(rows: string[][]): CalendlyAccountRow[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim() && (r[1] ?? "").toLowerCase() === "calendly")
    .map((r) => ({
      account_id: r[0] ?? "",
      type: "calendly",
      provider: "calendly",
      status: (r[3] as CalendlyAccountRow["status"]) || "disconnected",
      connected_at: r[4] ?? "",
      workspace_id: r[7] || "kames-default",
      access_token: r[8] ?? "",
      refresh_token: r[9] ?? "",
      token_expires_at: r[10] ?? "",
    }));
}

export async function getCalendlyAccount(workspaceId: string): Promise<CalendlyAccountRow | null> {
  await ensureAccountsSheet();
  const lastColumn = getColumnLetter(ACCOUNTS_HEADER.length);
  const rows = await getSheetData(`${ACCOUNTS_SHEET_NAME}!A:${lastColumn}`);
  return parseCalendlyAccountRows(rows).find((r) => r.workspace_id === workspaceId) ?? null;
}

export async function upsertCalendlyAccount(account: CalendlyAccountRow): Promise<void> {
  await ensureAccountsSheet();
  const lastColumn = getColumnLetter(ACCOUNTS_HEADER.length);
  const rows = await getSheetData(`${ACCOUNTS_SHEET_NAME}!A:${lastColumn}`);
  const existingIndex = rows.findIndex((r, i) => i > 0 && r[0] === account.account_id);
  const values = [
    account.account_id,
    account.type,
    account.provider,
    account.status,
    account.connected_at,
    "",
    "",
    account.workspace_id,
    account.access_token,
    account.refresh_token,
    account.token_expires_at,
  ];
  if (existingIndex > 0) {
    const rowNumber = existingIndex + 1;
    await updateRow(`${ACCOUNTS_SHEET_NAME}!A${rowNumber}:${lastColumn}${rowNumber}`, values);
    return;
  }
  await appendRow(`${ACCOUNTS_SHEET_NAME}!A:${lastColumn}`, values);
}

export const WORKSPACES_SHEET_NAME = "Workspaces";
export const WORKSPACES_HEADER = [
  "workspace_id",
  "name",
  "owner_email",
  "created_at",
  "default_calendly_event_uri",
] as const;

export interface WorkspaceRow {
  workspace_id: string;
  name: string;
  owner_email: string;
  created_at: string;
  default_calendly_event_uri: string;
}

export const LI_HEALTH_SHEET_NAME = "LI_Health";
export const LI_HEALTH_HEADER = [
  "account_id",
  "status",
  "reason",
  "pause_started_at",
  "last_check_at",
  "acceptance_rate_7d",
  "invites_sent_today",
  "invites_sent_week",
  "organic_action",
] as const;

export const LI_HEALTH_HISTORY_SHEET_NAME = "LI_Health_History";
export const LI_HEALTH_HISTORY_HEADER = [
  "account_id",
  "status",
  "reason",
  "pause_started_at",
  "last_check_at",
  "acceptance_rate_7d",
  "invites_sent_7d",
  "invites_accepted_7d",
  "invites_sent_today",
  "invites_sent_week",
  "organic_action",
] as const;

export interface LinkedInHealthRow {
  account_id: string;
  status: "active" | "paused_captcha" | "paused_warning" | "paused_low_accept" | "paused_follow_mode";
  reason: string;
  pause_started_at: string;
  last_check_at: string;
  acceptance_rate_7d: string;
  invites_sent_today?: string;
  invites_sent_week?: string;
  organic_action?: string;
}

export interface LinkedInHealthHistoryRow extends LinkedInHealthRow {
  invites_sent_7d: string;
  invites_accepted_7d: string;
}

/** Lecture directe de l'onglet Campagnes (sans cache — TASK-022 s'en chargera). */
export async function readIndex(): Promise<string[][]> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: INDEX_SHEET_ID,
    range: INDEX_CAMPAIGNS_RANGE,
  });
  return (response.data.values ?? []) as string[][];
}

export async function ensureAccountsSheet() {
  await ensureSheetExists(ACCOUNTS_SHEET_NAME, ACCOUNTS_HEADER);
}

export function parseLinkedInAccountRows(rows: string[][]): LinkedInAccountRow[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim() && (r[1] ?? "").toLowerCase() === "linkedin")
    .map((r) => ({
      account_id: r[0] ?? "",
      type: "linkedin",
      provider: "unipile",
      status: (r[3] as LinkedInAccountRow["status"]) || "disconnected",
      connected_at: r[4] ?? "",
      paused_reason: r[5] ?? "",
      pause_started_at: r[6] ?? "",
      workspace_id: r[7] || "kames-default",
    }));
}

export async function getLinkedInAccounts(): Promise<LinkedInAccountRow[]> {
  await ensureAccountsSheet();
  const lastColumn = getColumnLetter(ACCOUNTS_HEADER.length);
  const rows = await getSheetData(`${ACCOUNTS_SHEET_NAME}!A:${lastColumn}`);
  return parseLinkedInAccountRows(rows);
}

export async function getLatestLinkedInAccount(): Promise<LinkedInAccountRow | null> {
  const rows = await getLinkedInAccounts();
  return rows.sort((a, b) => new Date(b.connected_at).getTime() - new Date(a.connected_at).getTime())[0] ?? null;
}

export async function upsertLinkedInAccount(account: LinkedInAccountRow): Promise<void> {
  await ensureAccountsSheet();
  const lastColumn = getColumnLetter(ACCOUNTS_HEADER.length);
  const rows = await getSheetData(`${ACCOUNTS_SHEET_NAME}!A:${lastColumn}`);
  const existingIndex = rows.findIndex((row, index) => index > 0 && row[0] === account.account_id);
  const values = [
    account.account_id,
    account.type,
    account.provider,
    account.status,
    account.connected_at,
    account.paused_reason,
    account.pause_started_at,
    account.workspace_id || "kames-default",
  ];

  if (existingIndex > 0) {
    const rowNumber = existingIndex + 1;
    await updateRow(`${ACCOUNTS_SHEET_NAME}!A${rowNumber}:${lastColumn}${rowNumber}`, values);
    return;
  }

  await appendRow(`${ACCOUNTS_SHEET_NAME}!A:${lastColumn}`, values);
}

export async function ensureLinkedInHealthSheet() {
  await ensureSheetExists(LI_HEALTH_SHEET_NAME, LI_HEALTH_HEADER);
}

export async function ensureLinkedInHealthHistorySheet() {
  await ensureSheetExists(LI_HEALTH_HISTORY_SHEET_NAME, LI_HEALTH_HISTORY_HEADER);
}

export function parseLinkedInHealthRows(rows: string[][]): LinkedInHealthRow[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim())
    .map((r) => ({
      account_id: r[0] ?? "",
      status: (r[1] as LinkedInHealthRow["status"]) || "active",
      reason: r[2] ?? "",
      pause_started_at: r[3] ?? "",
      last_check_at: r[4] ?? "",
      acceptance_rate_7d: r[5] ?? "",
      invites_sent_today: r[6] ?? "0",
      invites_sent_week: r[7] ?? "0",
      organic_action: r[8] ?? "",
    }));
}

export function parseLinkedInHealthHistoryRows(rows: string[][]): LinkedInHealthHistoryRow[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim())
    .map((r) => ({
      account_id: r[0] ?? "",
      status: (r[1] as LinkedInHealthHistoryRow["status"]) || "active",
      reason: r[2] ?? "",
      pause_started_at: r[3] ?? "",
      last_check_at: r[4] ?? "",
      acceptance_rate_7d: r[5] ?? "",
      invites_sent_7d: r[6] ?? "",
      invites_accepted_7d: r[7] ?? "",
      invites_sent_today: r[8] ?? "0",
      invites_sent_week: r[9] ?? "0",
      organic_action: r[10] ?? "",
    }));
}

function formatLinkedInHealthRow(row: LinkedInHealthRow): string[] {
  return [
    row.account_id,
    row.status,
    row.reason,
    row.pause_started_at,
    row.last_check_at,
    row.acceptance_rate_7d,
    row.invites_sent_today ?? "0",
    row.invites_sent_week ?? "0",
    row.organic_action ?? "",
  ];
}

function formatLinkedInHealthHistoryRow(row: LinkedInHealthHistoryRow): string[] {
  return [
    row.account_id,
    row.status,
    row.reason,
    row.pause_started_at,
    row.last_check_at,
    row.acceptance_rate_7d,
    row.invites_sent_7d,
    row.invites_accepted_7d,
    row.invites_sent_today ?? "0",
    row.invites_sent_week ?? "0",
    row.organic_action ?? "",
  ];
}

export async function getLatestLinkedInHealth(accountId?: string): Promise<LinkedInHealthRow | null> {
  await ensureLinkedInHealthSheet();
  const lastColumn = getColumnLetter(LI_HEALTH_HEADER.length);
  const rows = await getSheetData(`${LI_HEALTH_SHEET_NAME}!A:${lastColumn}`);
  return parseLinkedInHealthRows(rows)
    .filter((row) => !accountId || row.account_id === accountId)
    .sort(
      (a, b) => new Date(b.last_check_at).getTime() - new Date(a.last_check_at).getTime()
    )[0] ?? null;
}

export async function upsertLinkedInHealth(row: LinkedInHealthRow): Promise<void> {
  await ensureLinkedInHealthSheet();
  const lastColumn = getColumnLetter(LI_HEALTH_HEADER.length);
  const rows = await getSheetData(`${LI_HEALTH_SHEET_NAME}!A:${lastColumn}`);
  const existingIndex = rows.findIndex((existingRow, index) => index > 0 && existingRow[0] === row.account_id);
  const values = formatLinkedInHealthRow(row);

  if (existingIndex > 0) {
    const rowNumber = existingIndex + 1;
    await updateRow(`${LI_HEALTH_SHEET_NAME}!A${rowNumber}:${lastColumn}${rowNumber}`, values);
    return;
  }

  await appendRow(`${LI_HEALTH_SHEET_NAME}!A:${lastColumn}`, values);
}

export async function appendLinkedInHealthHistory(row: LinkedInHealthHistoryRow): Promise<void> {
  await ensureLinkedInHealthHistorySheet();
  const lastColumn = getColumnLetter(LI_HEALTH_HISTORY_HEADER.length);
  await appendRow(`${LI_HEALTH_HISTORY_SHEET_NAME}!A:${lastColumn}`, formatLinkedInHealthHistoryRow(row));
}

export async function getLinkedInHealthHistory(accountId?: string): Promise<LinkedInHealthHistoryRow[]> {
  await ensureLinkedInHealthHistorySheet();
  const lastColumn = getColumnLetter(LI_HEALTH_HISTORY_HEADER.length);
  const rows = await getSheetData(`${LI_HEALTH_HISTORY_SHEET_NAME}!A:${lastColumn}`);
  return parseLinkedInHealthHistoryRows(rows)
    .filter((row) => !accountId || row.account_id === accountId)
    .sort((a, b) => new Date(a.last_check_at).getTime() - new Date(b.last_check_at).getTime())
    .slice(-30);
}

export async function ensureWorkspacesSheet() {
  await ensureSheetExists(WORKSPACES_SHEET_NAME, WORKSPACES_HEADER);
}

export function parseWorkspaceRows(rows: string[][]): WorkspaceRow[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim())
    .map((r) => ({
      workspace_id: r[0] ?? "",
      name: r[1] ?? "",
      owner_email: r[2] ?? "",
      created_at: r[3] ?? "",
      default_calendly_event_uri: r[4] ?? "",
    }));
}

export async function listWorkspaces(): Promise<WorkspaceRow[]> {
  await ensureWorkspacesSheet();
  const lastColumn = getColumnLetter(WORKSPACES_HEADER.length);
  const rows = await getSheetData(`${WORKSPACES_SHEET_NAME}!A:${lastColumn}`);
  return parseWorkspaceRows(rows);
}

export async function getWorkspace(workspaceId: string): Promise<WorkspaceRow | null> {
  const workspaces = await listWorkspaces();
  return workspaces.find((workspace) => workspace.workspace_id === workspaceId) ?? null;
}

export async function upsertWorkspace(workspace: WorkspaceRow): Promise<void> {
  await ensureWorkspacesSheet();
  const lastColumn = getColumnLetter(WORKSPACES_HEADER.length);
  const rows = await getSheetData(`${WORKSPACES_SHEET_NAME}!A:${lastColumn}`);
  const existingIndex = rows.findIndex((r, i) => i > 0 && r[0] === workspace.workspace_id);
  const values = [
    workspace.workspace_id,
    workspace.name,
    workspace.owner_email,
    workspace.created_at,
    workspace.default_calendly_event_uri,
  ];
  if (existingIndex > 0) {
    const rowNumber = existingIndex + 1;
    await updateRow(`${WORKSPACES_SHEET_NAME}!A${rowNumber}:${lastColumn}${rowNumber}`, values);
    return;
  }
  await appendRow(`${WORKSPACES_SHEET_NAME}!A:${lastColumn}`, values);
}

export const API_KEYS_SHEET_NAME = "ApiKeys";
export const API_KEYS_SHEET_HEADER = ["api_key", "workspace_id", "label", "created_at"] as const;

/** Onglet ApiKeys (Index) — clés API publiques par workspace (v4-034). */
export async function getApiKeyRows(): Promise<string[][]> {
  await ensureSheetExists(API_KEYS_SHEET_NAME, API_KEYS_SHEET_HEADER);
  const lastColumn = getColumnLetter(API_KEYS_SHEET_HEADER.length);
  return getSheetData(`${API_KEYS_SHEET_NAME}!A:${lastColumn}`);
}

/** Ajout d'une ligne dans l'onglet Campagnes de l'Index. */
export async function appendIndex(row: string[]): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: INDEX_SHEET_ID,
    range: INDEX_CAMPAIGNS_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

/** Mise à jour partielle d'une campagne dans l'Index (par campaign_id). */
export async function updateIndex(
  campaignId: string,
  patch: IndexCampaignPatch
): Promise<void> {
  const rows = await readIndex();
  if (rows.length <= 1) return;

  const [, ...data] = rows;
  const rowDataIndex = data.findIndex((r) => r[0] === campaignId);
  if (rowDataIndex === -1) return;

  const existingRow = [...(data[rowDataIndex] ?? [])];
  while (existingRow.length < INDEX_CAMPAIGNS_COLUMNS.length) existingRow.push("");

  for (const [key, value] of Object.entries(patch)) {
    const colIndex = (INDEX_CAMPAIGNS_COLUMNS as readonly string[]).indexOf(key);
    if (colIndex >= 0 && value !== undefined) {
      existingRow[colIndex] = value;
    }
  }

  const sheetRowNumber = rowDataIndex + 2; // +1 header, +1 base-1
  const lastCol = getColumnLetter(INDEX_CAMPAIGNS_COLUMNS.length);
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: INDEX_SHEET_ID,
    range: `Campagnes!A${sheetRowNumber}:${lastCol}${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [existingRow] },
  });
}

/** Lecture d'un GSheet enfant avec son spreadsheetId dynamique. */
export async function readChildSheet(
  sheetId: string,
  range: string
): Promise<string[][]> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return (response.data.values ?? []) as string[][];
}

/** Guillemets simples (A1) — apostrophe interne doublée. Voir A1 Google Sheets. */
export function quoteSheetNameForA1(sheetName: string): string {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

/** Onglet enfant + plage, ex. `'ma feuille'!A1:B2`. */
export function childSheetA1Range(sheetName: string, a1: string): string {
  return `${quoteSheetNameForA1(sheetName)}!${a1}`;
}

/**
 * L'API met parfois « Unable to parse range » (nom d’onglet, ou A1) ou onglet legacy
 * `Leads_Qualified` au lieu de `{campaignId}_Qualified`.
 */
export function isUnableToParseRangeError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Unable to parse range");
}

/**
 * Lit l’onglet des leads qualifiés : d’abord `{campaignId}_Qualified`, sinon `Leads_Qualified`.
 * Utilise le nom d’onglet **entre guillemets** (A1).
 * @param readImpl — injectable pour tests (défaut: `readChildSheet`).
 */
export async function readChildQualifiedLeads(
  sheetId: string,
  campaignId: string,
  a1Range: string,
  readImpl: typeof readChildSheet = readChildSheet
): Promise<string[][]> {
  const modern = childSheetA1Range(`${campaignId}_Qualified`, a1Range);
  try {
    return await readImpl(sheetId, modern);
  } catch (e) {
    if (!isUnableToParseRangeError(e)) throw e;
  }
  const legacy = childSheetA1Range("Leads_Qualified", a1Range);
  return readImpl(sheetId, legacy);
}

/** Écriture dans un GSheet enfant (spreadsheetId = fichier campagne). */
export async function updateChildSheetValues(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

export async function updateLeadFieldInChild(
  sheetId: string,
  campaignId: string,
  leadId: string,
  field: string,
  value: string
): Promise<void> {
  const fieldIndex = CHILD_QUALIFIED_HEADER.indexOf(field as never);
  if (fieldIndex === -1) throw new Error(`Champ inconnu dans CHILD_QUALIFIED_HEADER: ${field}`);

  const colLetter = getColumnLetter(fieldIndex + 1);
  const tabName = `${campaignId}_Qualified`;
  const sheets = await getSheets();

  // Read only column A (lead_ids) to find the row number
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: childSheetA1Range(tabName, "A2:A5000"),
  });

  const leadIds = (resp.data.values ?? []).map((r) => r[0] ?? "");
  const rowIndex = leadIds.findIndex((id) => id === leadId);
  if (rowIndex === -1) throw new Error(`Lead ${leadId} introuvable dans ${tabName}`);

  const rowNumber = rowIndex + 2; // +1 header, +1 for 1-indexed
  await updateChildSheetValues(sheetId, childSheetA1Range(tabName, `${colLetter}${rowNumber}`), [[value]]);
}

// ——— Création GSheet enfant (v4 — 1 fichier dédié par campagne) ———

export interface ChildSheetConfig {
  campaign_id: string;
  icp_md: string;
  secteur: string;
  villes: string;
  taille_equipe: string;
  poste_cible: string;
  offre_kames: string;
  template_email: string;
  score_minimum: string;
  target_qualified_leads: string;
  target_raw_leads: string;
  target_tolerance_percent: string;
  estimated_qualification_rate: string;
  search_terms: string;
  search_locations: string;
}

export const CHILD_QUALIFIED_HEADER = [
  "lead_id", "campaign_id", "nom", "site", "ville", "score", "score_reason",
  "email", "téléphone", "prénom", "poste", "secteur", "taille_equipe",
  "has_ia_services", "hiring_signals", "growth_stage", "buying_signal",
  "personalized_hook", "statut_email", "web_quality_score", "web_quality_signals",
  "societe", "prenom_gerant", "nom_gerant", "email_gerant", "email_type",
  "email_confidence",
  // v4
  "linkedin_url", "source_channel", "statut_li", "reply_intent", "reply_at",
  "setter_action",
] as const;

export const CHILD_CONVERSATIONS_HEADER = [
  "turn_id", "lead_id", "channel", "role", "content",
  "sent_at", "intent", "validated_by", "edited_from_draft", "tags", "human_intent_label",
] as const;

async function ensureChildGSheetTabs(spreadsheetId: string) {
  const sheets = await getSheets();
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title,index)",
  });
  const sheetProps = metadata.data.sheets?.map((sheet) => sheet.properties).filter(Boolean) ?? [];
  const titles = new Set(sheetProps.map((sheet) => sheet?.title).filter(Boolean));
  const requests: Array<Record<string, unknown>> = [];

  if (!titles.has("Leads_Raw")) {
    const firstSheet = sheetProps[0];
    if (firstSheet?.sheetId !== undefined) {
      requests.push({
        updateSheetProperties: {
          properties: { sheetId: firstSheet.sheetId, title: "Leads_Raw", index: 0 },
          fields: "title,index",
        },
      });
      titles.add("Leads_Raw");
    }
  }

  for (const [index, title] of ["Leads_Qualified", "Leads_Rejected", "Config", "Conversations"].entries()) {
    if (!titles.has(title)) {
      requests.push({ addSheet: { properties: { title, index: index + 1 } } });
      titles.add(title);
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }
}

async function createDriveSpreadsheetFile(title: string, folderId?: string) {
  const drive = await getDrive();
  const templateId = process.env.GOOGLE_CHILD_SHEET_TEMPLATE_ID ?? process.env.GOOGLE_SHEET_TEMPLATE_ID;
  const parents = folderId ? [folderId] : undefined;

  if (templateId) {
    const copied = await drive.files.copy({
      fileId: templateId,
      supportsAllDrives: true,
      requestBody: {
        name: title,
        parents,
      },
      fields: "id, webViewLink",
    });
    return {
      spreadsheetId: copied.data.id!,
      sheetUrl: copied.data.webViewLink ?? `https://docs.google.com/spreadsheets/d/${copied.data.id}`,
    };
  }

  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: title,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents,
    },
    fields: "id, webViewLink",
  });

  return {
    spreadsheetId: created.data.id!,
    sheetUrl: created.data.webViewLink ?? `https://docs.google.com/spreadsheets/d/${created.data.id}`,
  };
}

async function transferDriveOwnershipIfConfigured(spreadsheetId: string) {
  const ownerEmail = process.env.GOOGLE_DRIVE_OWNER_EMAIL;
  if (!ownerEmail || isUsingUserOAuth()) return;

  const drive = await getDrive();
  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      supportsAllDrives: true,
      sendNotificationEmail: true,
      requestBody: {
        type: "user",
        role: "writer",
        pendingOwner: true,
        emailAddress: ownerEmail,
      },
    });
  } catch (error) {
    console.warn(
      `Drive ownership transfer skipped for ${spreadsheetId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function shareDriveFileWithServiceAccount(spreadsheetId: string) {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!serviceAccountEmail || !isUsingUserOAuth()) return;

  const drive = await getDrive();
  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      supportsAllDrives: true,
      sendNotificationEmail: false,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: serviceAccountEmail,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists|duplicate/i.test(message)) {
      throw error;
    }
  }
}

/**
 * Crée un nouveau fichier GSheet dédié à la campagne (1 fichier par campagne).
 * Onglets : Leads_Raw, Leads_Qualified (v4), Leads_Rejected, Config (v4), Conversations
 * Si GOOGLE_OAUTH_* est configuré, crée/copiera avec le compte Gmail utilisateur
 * pour éviter le quota nul du service account.
 */
export async function createChildGSheet(
  _sheetName: string,
  config: ChildSheetConfig
): Promise<{ spreadsheetId: string; sheetUrl: string }> {
  const sheets = await getSheets();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const title = `Flinty — ${config.campaign_id}`;
  let spreadsheetId: string;
  let sheetUrl: string;

  // 1. Créer/copier le fichier via Drive si possible. En Gmail gratuit, le chemin OAuth
  // utilisateur est le plus fiable : le fichier appartient au Gmail, pas au service account.
  if (folderId) {
    const created = await createDriveSpreadsheetFile(title, folderId);
    spreadsheetId = created.spreadsheetId;
    sheetUrl = created.sheetUrl;
    await transferDriveOwnershipIfConfigured(spreadsheetId);
    await shareDriveFileWithServiceAccount(spreadsheetId);
    await ensureChildGSheetTabs(spreadsheetId);
  } else {
    const newSheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [
          { properties: { title: "Leads_Raw", index: 0 } },
          { properties: { title: "Leads_Qualified", index: 1 } },
          { properties: { title: "Leads_Rejected", index: 2 } },
          { properties: { title: "Config", index: 3 } },
          { properties: { title: "Conversations", index: 4 } },
        ],
      },
    });
    spreadsheetId = newSheet.data.spreadsheetId!;
    sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  // 2. Headers sur chaque onglet
  const qualifiedLastCol = getColumnLetter(CHILD_QUALIFIED_HEADER.length);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: "Leads_Raw!A1:J1",
          values: [["lead_id", "campaign_id", "nom", "site", "ville", "téléphone", "rating", "reviews_count", "maps_url", "found_at"]],
        },
        {
          range: `Leads_Qualified!A1:${qualifiedLastCol}1`,
          values: [[...CHILD_QUALIFIED_HEADER]],
        },
        {
          range: "Leads_Rejected!A1:G1",
          values: [["lead_id", "campaign_id", "nom", "site", "score", "rejection_reason", "processed_at"]],
        },
        {
          range: "Config!A1:C1",
          values: [["param_key", "param_value", "description"]],
        },
        {
          range: "Conversations!A1:K1",
          values: [[...CHILD_CONVERSATIONS_HEADER]],
        },
      ],
    },
  });

  // 4. Lignes Config (v3 + v4)
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Config!A2:C",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["icp_md",                      config.icp_md,                      "ICP généré par Claude"],
        ["secteur",                      config.secteur,                     "Secteur cible"],
        ["villes",                       config.villes,                      "Villes (séparées virgule)"],
        ["taille_equipe",               config.taille_equipe,               "Taille équipe cible"],
        ["poste_cible",                 config.poste_cible,                 "Poste décideur"],
        ["offre_kames",                 config.offre_kames,                 "Offre proposée"],
        ["template_email",              config.template_email,              "Template email J0"],
        ["score_minimum",               config.score_minimum,               "Seuil qualification (%)"],
        ["target_qualified_leads",      config.target_qualified_leads,      "Objectif de leads qualifiés"],
        ["target_raw_leads",            config.target_raw_leads,            "Volume raw estimé pour atteindre l'objectif"],
        ["target_tolerance_percent",    config.target_tolerance_percent,    "Tolérance autour de l'objectif qualifié"],
        ["estimated_qualification_rate",config.estimated_qualification_rate,"Taux qualif estimé pour calculer le raw"],
        ["search_terms",                config.search_terms,                "Métiers à scraper (séparés virgule)"],
        ["search_locations",            config.search_locations,            "Villes à scraper (séparées virgule)"],
        // v4
        ["setter_enabled",      "FALSE",   "Activer le Setter IA"],
        ["setter_validation",   "TRUE",    "Validation humaine obligatoire avant envoi"],
        ["setter_validation_locked_until", "", "Date ISO de fin warm-up Setter"],
        ["warmup_campaign",     "FALSE",   "Mode soft warm-up email 14 jours"],
        ["warmup_started_at",   "",        "Date ISO de démarrage du warm-up"],
        ["warmup_positive_replies", "0",   "Replies positives taggées pendant le warm-up"],
        ["setter_tone",         "formal",  "Ton du Setter (formal|casual)"],
        ["setter_signature",    "Thomas",  "Nom de signature"],
        ["calendly_event_uri",  process.env.CALENDLY_EVENT_TYPE_URI ?? "", "URI Calendly pour réservation"],
        ["li_caps_daily",       "20",      "Cap quotidien invitations LinkedIn"],
      ],
    },
  });

  return { spreadsheetId, sheetUrl };
}

/**
 * Met à jour la valeur d'un param_key dans l'onglet Config du GSheet enfant.
 * Essaie "{campaign_id}_Config" (legacy/fichier partagé) en premier,
 * puis "Config" (v4 — 1 fichier par campagne).
 */
export async function updateConfigValue(
  spreadsheetId: string,
  campaign_id: string,
  param_key: string,
  param_value: string
): Promise<void> {
  const sheets = await getSheets();
  const tabNames = [`${campaign_id}_Config`, "Config"];

  for (const configTab of tabNames) {
    let rows: string[][];
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${configTab}!A:B`,
      });
      rows = (response.data.values ?? []) as string[][];
    } catch (e) {
      if (e instanceof Error && e.message.includes("Unable to parse range")) continue;
      throw e;
    }

    const rowIndex = rows.findIndex((r) => r[0] === param_key);
    if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${configTab}!A:C`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[param_key, param_value, ""]] },
      });
      return;
    }

    const sheetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${configTab}!B${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[param_value]] },
    });
    return;
  }
}
