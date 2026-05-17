/**
 * Migration GSheets v4 — idempotent.
 * Ajoute les nouveaux onglets et colonnes sans modifier les données v3.
 *
 * Exécuter : npx tsx scripts/migrate-sheets-v4.ts
 * (ou : npx ts-node scripts/migrate-sheets-v4.ts)
 */
import { google } from "googleapis";

// ——— Config ———

const INDEX_SHEET_ID = process.env.GOOGLE_INDEX_SHEET_ID!;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

// Nouvelles colonnes Campagnes v4 (append après col 13 = N, index 0-based)
const CAMPAGNES_V4_COLS = ["setter_enabled", "setter_validation", "li_account_id", "calendly_event_uri"];

// Nouvelles colonnes Leads_Qualified v4 (append après col 27 existantes)
const LEADS_QUALIFIED_V4_COLS = ["linkedin_url", "source_channel", "statut_li", "reply_intent", "reply_at"];

// Nouveaux onglets Index
const EMAIL_HEALTH_HEADER = [
  "domain", "sent_today", "bounce_rate_7d", "complaint_rate_7d",
  "last_mail_tester_score", "last_check_at", "status",
];
const ACCOUNTS_HEADER = [
  "account_id", "type", "provider", "unipile_id", "status", "connected_at", "workspace_id",
];

// Nouveaux onglets enfant
const CONVERSATIONS_HEADER = [
  "turn_id", "lead_id", "channel", "role", "content", "sent_at", "intent", "validated_by", "edited_from_draft",
];
const MEETINGS_V4_HEADER = [
  "meeting_id", "lead_id", "calendly_uri", "start_at", "event_type", "booked_via", "status",
];

// Config rows par défaut pour GSheets enfant
const CONFIG_DEFAULT_ROWS = [
  ["setter_enabled", "FALSE"],
  ["setter_validation", "TRUE"],
  ["setter_tone", "formal"],
  ["setter_signature", "Thomas Callendreau, Kames AI"],
  ["calendly_event_uri", process.env.CALENDLY_EVENT_TYPE_URI ?? ""],
  ["li_caps_daily", "20"],
];

// ——— Auth ———

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: { client_email: SERVICE_ACCOUNT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheets() {
  const auth = await getAuth().getClient();
  return google.sheets({ version: "v4", auth: auth as never });
}

// ——— Helpers ———

async function getTabTitles(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string): Promise<string[]> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  return (meta.data.sheets ?? []).map((s) => s.properties?.title ?? "").filter(Boolean);
}

async function createTab(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string,
  header: string[]
): Promise<void> {
  console.log(`  → Création onglet "${title}"...`);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${title}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [header] },
  });
  console.log(`     ✓ Onglet "${title}" créé avec ${header.length} colonnes`);
}

async function appendMissingColumns(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tabName: string,
  newCols: string[]
): Promise<void> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!1:1`,
  });
  const existingHeader: string[] = response.data.values?.[0] ?? [];
  const missing = newCols.filter((col) => !existingHeader.includes(col));

  if (missing.length === 0) {
    console.log(`     ✓ "${tabName}" colonnes déjà présentes`);
    return;
  }

  const startCol = existingHeader.length + 1;
  const endCol = startCol + missing.length - 1;
  const startLetter = colLetter(startCol);
  const endLetter = colLetter(endCol);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!${startLetter}1:${endLetter}1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [missing] },
  });
  console.log(`     ✓ "${tabName}" +${missing.length} colonnes : ${missing.join(", ")}`);
}

async function appendMissingConfigRows(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
): Promise<void> {
  const tabName = "Config";
  const tabs = await getTabTitles(sheets, spreadsheetId);
  if (!tabs.includes(tabName)) {
    console.log(`     ⚠ Onglet Config absent — création ignorée (sera créé par WF1)`);
    return;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:A`,
  });
  const existingKeys = new Set((response.data.values ?? []).flat().filter(Boolean));
  const missing = CONFIG_DEFAULT_ROWS.filter(([key]) => !existingKeys.has(key));

  if (missing.length === 0) {
    console.log(`     ✓ Config clés déjà présentes`);
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A:B`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: missing },
  });
  console.log(`     ✓ Config +${missing.length} clés : ${missing.map(([k]) => k).join(", ")}`);
}

function colLetter(n: number): string {
  let dividend = n;
  let name = "";
  while (dividend > 0) {
    const mod = (dividend - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    dividend = Math.floor((dividend - mod) / 26);
  }
  return name;
}

// ——— Main ———

async function migrateIndex(sheets: ReturnType<typeof google.sheets>): Promise<string[]> {
  console.log("\n📋 Migration Index GSheet...");
  const tabs = await getTabTitles(sheets, INDEX_SHEET_ID);

  // Campagnes : nouvelles colonnes v4
  await appendMissingColumns(sheets, INDEX_SHEET_ID, "Campagnes", CAMPAGNES_V4_COLS);

  // Email_Health : créer si absent
  if (!tabs.includes("Email_Health")) {
    await createTab(sheets, INDEX_SHEET_ID, "Email_Health", EMAIL_HEALTH_HEADER);
  } else {
    console.log(`     ✓ Onglet "Email_Health" déjà présent`);
  }

  // Accounts : créer si absent
  if (!tabs.includes("Accounts")) {
    await createTab(sheets, INDEX_SHEET_ID, "Accounts", ACCOUNTS_HEADER);
  } else {
    console.log(`     ✓ Onglet "Accounts" déjà présent`);
  }

  // Récupérer sheet_ids des campagnes enfants
  const campaignsResp = await sheets.spreadsheets.values.get({
    spreadsheetId: INDEX_SHEET_ID,
    range: "Campagnes!A2:C500",
  });
  const rows = (campaignsResp.data.values ?? []) as string[][];
  return rows.map((r) => r[2]).filter(Boolean); // col C = sheet_id
}

async function migrateChild(sheets: ReturnType<typeof google.sheets>, sheetId: string, index: number): Promise<void> {
  console.log(`\n  📄 Enfant #${index + 1} : ${sheetId}`);
  const tabs = await getTabTitles(sheets, sheetId);

  // Leads_Qualified : nouvelles colonnes v4
  const qualifiedTab = tabs.find((t) => t.endsWith("_Qualified") || t === "Leads_Qualified");
  if (qualifiedTab) {
    await appendMissingColumns(sheets, sheetId, qualifiedTab, LEADS_QUALIFIED_V4_COLS);
  } else {
    console.log(`     ⚠ Onglet _Qualified introuvable`);
  }

  // Conversations : créer si absent
  if (!tabs.includes("Conversations")) {
    await createTab(sheets, sheetId, "Conversations", CONVERSATIONS_HEADER);
  } else {
    console.log(`     ✓ Onglet "Conversations" déjà présent`);
  }

  // Meetings v4 : créer si absent (ou ajouter si c'est l'ancien format v3)
  if (!tabs.includes("Meetings_v4")) {
    if (!tabs.includes("Meetings")) {
      await createTab(sheets, sheetId, "Meetings", MEETINGS_V4_HEADER);
    } else {
      console.log(`     ✓ Onglet "Meetings" déjà présent`);
    }
  }

  // Config : append clés manquantes
  await appendMissingConfigRows(sheets, sheetId);
}

async function main() {
  console.log("🚀 Migration GSheets v4 — Flinty");
  console.log("====================================");

  if (!INDEX_SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    console.error("❌ Variables env manquantes : GOOGLE_INDEX_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY");
    process.exit(1);
  }

  const sheets = await getSheets();

  const childSheetIds = await migrateIndex(sheets);
  console.log(`\n   ${childSheetIds.length} feuille(s) enfant trouvée(s)`);

  for (let i = 0; i < childSheetIds.length; i++) {
    await migrateChild(sheets, childSheetIds[i], i);
  }

  console.log("\n✅ Migration terminée avec succès");
}

main().catch((err) => {
  console.error("❌ Erreur migration :", err);
  process.exit(1);
});
