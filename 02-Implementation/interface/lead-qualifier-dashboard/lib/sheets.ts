import { google } from "googleapis";
import {
  EMAIL_TEMPLATES_HEADER,
  EMAIL_TEMPLATES_SHEET_NAME,
  mergeCampaignEmailTemplates,
  type CampaignEmailTemplates,
  type EmailTemplateEntry,
} from "@/lib/email-templates";

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

  const headerRows = await getSheetData(`${title}!A1:G1`).catch(() => []);
  const currentHeader = headerRows[0] ?? [];
  const needsHeader =
    currentHeader.length !== header.length ||
    header.some((column, index) => currentHeader[index] !== column);

  if (needsHeader) {
    await updateRow(`${title}!A1:G1`, [...header]);
  }
}

export async function ensureEmailTemplatesSheet() {
  await ensureSheetExists(EMAIL_TEMPLATES_SHEET_NAME, EMAIL_TEMPLATES_HEADER);
}

// ——— Types ———

export interface Campaign {
  campaign_id: string;
  nom: string;
  secteur: string;
  localisation: string;
  date_création: string;
  offre_kames: string;
  statut: "active" | "generating" | "scheduled" | "paused";
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
  site: string;
  ville: string;
  score: string;
  email: string;
  téléphone: string;
  prénom: string;
  poste: string;
  secteur: string;
  taille_equipe: string;
  has_ia_services: string;
  statut_email: string;
  raison_score: string;
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
    lead_id: r[0] ?? "",
    campaign_id: r[1] ?? "",
    nom: r[2] ?? "",
    site: r[3] ?? "",
    ville: r[4] ?? "",
    score: r[5] ?? "0",
    email: r[6] ?? "",
    téléphone: r[7] ?? "",
    prénom: r[8] ?? "",
    poste: r[9] ?? "",
    secteur: r[10] ?? "",
    taille_equipe: r[11] ?? "",
    has_ia_services: r[12] ?? "",
    statut_email: r[13] ?? "new",
    raison_score: r[14] ?? "",
    last_email_sent_at: r[15],
  }));
}

export function parseEmailTemplateEntries(rows: string[][]): EmailTemplateEntry[] {
  if (!rows.length) return [];

  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim().length > 0)
    .map((r) => ({
      campaign_id: r[0] ?? "",
      sequence_key: (r[1] ?? "j0") as EmailTemplateEntry["sequence_key"],
      variant_key: (r[2] ?? "default") as EmailTemplateEntry["variant_key"],
      label: r[3] ?? "",
      subject: r[4] ?? "",
      body: r[5] ?? "",
      updated_at: r[6] ?? "",
    }));
}

export async function getCampaignEmailTemplates(
  campaignId: string
): Promise<CampaignEmailTemplates> {
  await ensureEmailTemplatesSheet();
  const rows = await getSheetData(`${EMAIL_TEMPLATES_SHEET_NAME}!A:G`);
  const entries = parseEmailTemplateEntries(rows).filter(
    (entry) => entry.campaign_id === campaignId
  );

  return mergeCampaignEmailTemplates(campaignId, entries);
}

export async function saveCampaignEmailTemplates(
  campaignId: string,
  entries: Omit<EmailTemplateEntry, "campaign_id" | "updated_at">[]
) {
  await ensureEmailTemplatesSheet();

  const rows = await getSheetData(`${EMAIL_TEMPLATES_SHEET_NAME}!A:G`);
  const existingEntries = parseEmailTemplateEntries(rows);
  const timestamp = new Date().toISOString();

  for (const entry of entries) {
    const rowIndex = existingEntries.findIndex(
      (candidate) =>
        candidate.campaign_id === campaignId &&
        candidate.sequence_key === entry.sequence_key &&
        candidate.variant_key === entry.variant_key
    );

    const values = [
      campaignId,
      entry.sequence_key,
      entry.variant_key,
      entry.label,
      entry.subject,
      entry.body,
      timestamp,
    ];

    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2;
      await updateRow(`${EMAIL_TEMPLATES_SHEET_NAME}!A${rowNumber}:G${rowNumber}`, values);
    } else {
      await appendRow(`${EMAIL_TEMPLATES_SHEET_NAME}!A:G`, values);
      existingEntries.push({
        campaign_id: campaignId,
        sequence_key: entry.sequence_key,
        variant_key: entry.variant_key,
        label: entry.label,
        subject: entry.subject,
        body: entry.body,
        updated_at: timestamp,
      });
    }
  }

  return getCampaignEmailTemplates(campaignId);
}
