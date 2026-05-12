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

/** Parse les lignes d'un onglet {campaign_id}_Qualified (schéma v4, 27 colonnes A:AA). */
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

/** Convertit un IndexCampaign v3 vers l'ancien type Campaign (taux_ouverture absent → "0"). */
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
] as const;

type IndexCampaignColumnName = (typeof INDEX_CAMPAIGNS_COLUMNS)[number];
type IndexCampaignPatch = Partial<Record<IndexCampaignColumnName, string>>;

const INDEX_CAMPAIGNS_RANGE = "Campagnes!A:M";

/** Lecture directe de l'onglet Campagnes (sans cache — TASK-022 s'en chargera). */
export async function readIndex(): Promise<string[][]> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: INDEX_SHEET_ID,
    range: INDEX_CAMPAIGNS_RANGE,
  });
  return (response.data.values ?? []) as string[][];
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

// ——— Création GSheet enfant (v3 — Option A : onglets dans spreadsheet partagé) ———

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

/**
 * Crée les 4 onglets d'une campagne dans GOOGLE_CAMPAIGNS_SHEET_ID (spreadsheet partagé).
 * Onglets : {campaign_id}_Raw, {campaign_id}_Qualified, {campaign_id}_Rejected, {campaign_id}_Config
 * Retourne spreadsheetId = GOOGLE_CAMPAIGNS_SHEET_ID et un sheetUrl ancré sur l'onglet Raw.
 */
export async function createChildGSheet(
  _sheetName: string,
  config: ChildSheetConfig
): Promise<{ spreadsheetId: string; sheetUrl: string }> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_CAMPAIGNS_SHEET_ID!;
  const p = config.campaign_id; // préfixe onglets

  // 1. Créer les 4 onglets
  const batchRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        { addSheet: { properties: { title: `${p}_Raw` } } },
        { addSheet: { properties: { title: `${p}_Qualified` } } },
        { addSheet: { properties: { title: `${p}_Rejected` } } },
        { addSheet: { properties: { title: `${p}_Config` } } },
      ],
    },
  });

  // Récupérer le gid de l'onglet Raw pour l'URL d'ancrage
  const rawGid = batchRes.data.replies?.[0]?.addSheet?.properties?.sheetId;
  const sheetUrl = rawGid != null
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}#gid=${rawGid}`
    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Headers v4 sur chaque onglet
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: `${p}_Raw!A1:J1`,
          values: [["lead_id", "campaign_id", "nom", "site", "ville", "téléphone", "rating", "reviews_count", "maps_url", "found_at"]],
        },
        {
          range: `${p}_Qualified!A1:AB1`,
          values: [["lead_id", "campaign_id", "nom", "site", "ville", "score", "score_reason", "email", "téléphone", "prénom", "poste", "secteur", "taille_equipe", "has_ia_services", "hiring_signals", "growth_stage", "buying_signal", "personalized_hook", "statut_email", "web_quality_score", "web_quality_signals", "societe", "prenom_gerant", "nom_gerant", "email_gerant", "email_type", "email_confidence"]],
        },
        {
          range: `${p}_Rejected!A1:G1`,
          values: [["lead_id", "campaign_id", "nom", "site", "score", "rejection_reason", "processed_at"]],
        },
        {
          range: `${p}_Config!A1:C1`,
          values: [["param_key", "param_value", "description"]],
        },
      ],
    },
  });

  // 3. Lignes Config
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${p}_Config!A2:C`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["icp_md", config.icp_md, "ICP généré par Claude"],
        ["secteur", config.secteur, "Secteur cible"],
        ["villes", config.villes, "Villes (séparées virgule)"],
        ["taille_equipe", config.taille_equipe, "Taille équipe cible"],
        ["poste_cible", config.poste_cible, "Poste décideur"],
        ["offre_kames", config.offre_kames, "Offre proposée"],
        ["template_email", config.template_email, "Template email J0"],
        ["score_minimum", config.score_minimum, "Seuil qualification (%)"],
        ["target_qualified_leads", config.target_qualified_leads, "Objectif de leads qualifiés"],
        ["target_raw_leads", config.target_raw_leads, "Volume raw estimé pour atteindre l'objectif"],
        ["target_tolerance_percent", config.target_tolerance_percent, "Tolérance autour de l'objectif qualifié"],
        ["estimated_qualification_rate", config.estimated_qualification_rate, "Taux qualif estimé pour calculer le raw"],
        ["search_terms", config.search_terms, "Métiers à scraper (séparés virgule)"],
        ["search_locations", config.search_locations, "Villes à scraper (séparées virgule)"],
      ],
    },
  });

  return { spreadsheetId, sheetUrl };
}

/**
 * Met à jour la valeur d'un param_key dans l'onglet {campaign_id}_Config.
 * Utilisé pour re-synchroniser icp_md après (re)génération de l'ICP.
 */
export async function updateConfigValue(
  spreadsheetId: string,
  campaign_id: string,
  param_key: string,
  param_value: string
): Promise<void> {
  const sheets = await getSheets();
  const configTab = `${campaign_id}_Config`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${configTab}!A:B`,
  });

  const rows = (response.data.values ?? []) as string[][];
  const rowIndex = rows.findIndex((r) => r[0] === param_key);
  if (rowIndex === -1) return; // clé introuvable, rien à faire

  // +1 car Sheets est 1-indexed, +1 pour le header → rowIndex 0 = ligne 1 (header)
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${configTab}!B${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[param_value]] },
  });
}
