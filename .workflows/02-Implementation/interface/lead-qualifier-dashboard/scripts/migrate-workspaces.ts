/**
 * Migration v4-030 — Ajout workspace_id
 *
 * 1. Crée l'onglet Workspaces dans l'Index avec kames-default
 * 2. Ajoute workspace_id (col N) aux lignes Campagnes sans cette colonne
 * 3. Ajoute workspace_id (col H) aux lignes Accounts sans cette colonne
 *
 * Usage : npx tsx scripts/migrate-workspaces.ts
 */

import { google } from "googleapis";

const INDEX_SHEET_ID = process.env.GOOGLE_INDEX_SHEET_ID!;
const DEFAULT_WORKSPACE_ID = "kames-default";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheets() {
  const auth = await getAuth().getClient();
  return google.sheets({ version: "v4", auth: auth as never });
}

async function getTabTitles(sheets: ReturnType<typeof google.sheets>): Promise<Set<string>> {
  const res = await sheets.spreadsheets.get({
    spreadsheetId: INDEX_SHEET_ID,
    fields: "sheets.properties.title",
  });
  return new Set(
    (res.data.sheets ?? [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t))
  );
}

async function ensureWorkspacesTab(sheets: ReturnType<typeof google.sheets>, titles: Set<string>) {
  if (!titles.has("Workspaces")) {
    console.log("→ Création onglet Workspaces…");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: INDEX_SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: "Workspaces" } } }] },
    });
  } else {
    console.log("→ Onglet Workspaces déjà présent.");
  }

  // Header
  await sheets.spreadsheets.values.update({
    spreadsheetId: INDEX_SHEET_ID,
    range: "Workspaces!A1:E1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["workspace_id", "name", "owner_email", "created_at", "default_calendly_event_uri"]] },
  });

  // Check if kames-default row exists
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: INDEX_SHEET_ID,
    range: "Workspaces!A2:A100",
  });
  const ids = (existing.data.values ?? []).map((r) => r[0]);
  if (!ids.includes(DEFAULT_WORKSPACE_ID)) {
    console.log("→ Insertion workspace kames-default…");
    await sheets.spreadsheets.values.append({
      spreadsheetId: INDEX_SHEET_ID,
      range: "Workspaces!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[DEFAULT_WORKSPACE_ID, "Kames AI", "thomas@kamesai.com", new Date().toISOString(), process.env.CALENDLY_EVENT_TYPE_URI ?? ""]],
      },
    });
  } else {
    console.log("→ Workspace kames-default déjà présent.");
  }
}

async function migrateCampagnes(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n→ Migration onglet Campagnes (col N = workspace_id)…");

  // Update header row (A1:N1)
  await sheets.spreadsheets.values.update({
    spreadsheetId: INDEX_SHEET_ID,
    range: "Campagnes!A1:N1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "campaign_id", "nom", "sheet_id", "sheet_url", "secteur",
        "localisation", "offre_kames", "statut", "date_création",
        "total_leads_raw", "total_leads_qualified", "emails_envoyés", "taux_réponse",
        "workspace_id",
      ]],
    },
  });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: INDEX_SHEET_ID,
    range: "Campagnes!A2:N5000",
  });

  const rows = (res.data.values ?? []) as string[][];
  if (!rows.length) {
    console.log("  Aucune campagne à migrer.");
    return;
  }

  const updates: { range: string; values: string[][] }[] = [];
  rows.forEach((row, i) => {
    const hasWorkspaceId = (row[13] ?? "").trim() !== "";
    if (!hasWorkspaceId && (row[0] ?? "").trim()) {
      updates.push({
        range: `Campagnes!N${i + 2}`,
        values: [[DEFAULT_WORKSPACE_ID]],
      });
    }
  });

  if (!updates.length) {
    console.log("  Toutes les campagnes ont déjà un workspace_id.");
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: INDEX_SHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates,
    },
  });
  console.log(`  ${updates.length} campagne(s) mises à jour.`);
}

async function migrateAccounts(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n→ Migration onglet Accounts (col H = workspace_id)…");

  // Update header
  await sheets.spreadsheets.values.update({
    spreadsheetId: INDEX_SHEET_ID,
    range: "Accounts!A1:H1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["account_id", "type", "provider", "status", "connected_at", "paused_reason", "pause_started_at", "workspace_id"]],
    },
  });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: INDEX_SHEET_ID,
    range: "Accounts!A2:H5000",
  });

  const rows = (res.data.values ?? []) as string[][];
  const updates: { range: string; values: string[][] }[] = [];
  rows.forEach((row, i) => {
    const hasWorkspaceId = (row[7] ?? "").trim() !== "";
    if (!hasWorkspaceId && (row[0] ?? "").trim()) {
      updates.push({ range: `Accounts!H${i + 2}`, values: [[DEFAULT_WORKSPACE_ID]] });
    }
  });

  if (!updates.length) {
    console.log("  Tous les comptes ont déjà un workspace_id.");
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: INDEX_SHEET_ID,
    requestBody: { valueInputOption: "USER_ENTERED", data: updates },
  });
  console.log(`  ${updates.length} compte(s) mis à jour.`);
}

async function main() {
  if (!INDEX_SHEET_ID) {
    console.error("GOOGLE_INDEX_SHEET_ID manquant dans .env.local");
    process.exit(1);
  }

  console.log("=== Migration Workspaces v4-030 ===");
  const sheets = await getSheets();
  const titles = await getTabTitles(sheets);

  await ensureWorkspacesTab(sheets, titles);
  await migrateCampagnes(sheets);
  await migrateAccounts(sheets);

  console.log("\n✓ Migration terminée.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
