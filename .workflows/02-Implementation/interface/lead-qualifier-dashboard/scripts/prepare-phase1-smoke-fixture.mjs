#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.resolve(root, "../../../..", ".env.local"));

const INDEX_COLUMNS = [
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
  "workspace_id",
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
  "email_type",
  "email_confidence",
  "linkedin_url",
  "source_channel",
  "statut_li",
  "reply_intent",
  "reply_at",
  "setter_action",
];

const CONVERSATIONS_HEADER = [
  "turn_id",
  "lead_id",
  "channel",
  "role",
  "content",
  "sent_at",
  "intent",
  "validated_by",
  "edited_from_draft",
  "tags",
  "human_intent_label",
];

const MEETINGS_HEADER = [
  "meeting_id",
  "lead_id",
  "calendly_uri",
  "start_at",
  "event_type",
  "booked_via",
  "status",
];

const GRADUATION_INTENTS = [
  "interested",
  "meeting_ready",
  "objection_price",
  "objection_timing",
  "not_interested",
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant dans .env.local`);
  return value;
}

function getColumnLetter(columnNumber) {
  let dividend = columnNumber;
  let columnName = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return columnName;
}

function makeId(prefix) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${stamp}_${random}`;
}

function parseCsv(value) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function daysAgoIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

async function getClients() {
  const hasUserOAuth =
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  let client;

  if (hasUserOAuth) {
    client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    );
    client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
  } else {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        private_key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });
    client = await auth.getClient();
  }

  return {
    sheets: google.sheets({ version: "v4", auth: client }),
    drive: google.drive({ version: "v3", auth: client }),
  };
}

async function readRows(sheets, spreadsheetId, range) {
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return response.data.values ?? [];
}

async function updateValues(sheets, spreadsheetId, range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function appendValues(sheets, spreadsheetId, range, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

async function ensureSheet(sheets, spreadsheetId, title, headerRange, header) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });
  const exists = (meta.data.sheets ?? []).some((sheet) => sheet.properties?.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
  }
  await updateValues(sheets, spreadsheetId, headerRange, [header]);
}

async function findExistingCampaign(sheets, campaignName) {
  const rows = await readRows(sheets, requireEnv("GOOGLE_INDEX_SHEET_ID"), "Campagnes!A:N");
  return rows.slice(1).find((row) => row[1] === campaignName) ?? null;
}

function hasUserOAuthCredentials() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  );
}

async function createDriveSpreadsheetFile(drive, title, folderId) {
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
      spreadsheetId: copied.data.id,
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
    spreadsheetId: created.data.id,
    sheetUrl: created.data.webViewLink ?? `https://docs.google.com/spreadsheets/d/${created.data.id}`,
  };
}

async function transferDriveOwnershipIfConfigured(drive, spreadsheetId) {
  const ownerEmail = process.env.GOOGLE_DRIVE_OWNER_EMAIL;
  if (!ownerEmail || hasUserOAuthCredentials()) return;

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
      }`,
    );
  }
}

async function shareDriveFileWithServiceAccount(drive, spreadsheetId) {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!serviceAccountEmail || !hasUserOAuthCredentials()) return;

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

async function ensureChildSheetTabs(sheets, spreadsheetId) {
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Leads_Raw",
    "Leads_Raw!A1:J1",
    ["lead_id", "campaign_id", "nom", "site", "ville", "telephone", "rating", "reviews_count", "maps_url", "found_at"],
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Leads_Qualified",
    `Leads_Qualified!A1:${getColumnLetter(QUALIFIED_HEADER.length)}1`,
    QUALIFIED_HEADER,
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Leads_Rejected",
    "Leads_Rejected!A1:G1",
    ["lead_id", "campaign_id", "nom", "site", "score", "rejection_reason", "processed_at"],
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Config",
    "Config!A1:C1",
    ["param_key", "param_value", "description"],
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Conversations",
    "Conversations!A1:K1",
    CONVERSATIONS_HEADER,
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Meetings",
    "Meetings!A1:G1",
    MEETINGS_HEADER,
  );
}

async function createChildSheet(sheets, drive, campaignId, campaignName, config) {
  const title = `Flinty smoke - ${campaignName}`;
  const folderId = process.env.SMOKE_SKIP_DRIVE_MOVE === "1" ? "" : process.env.GOOGLE_DRIVE_FOLDER_ID;
  let spreadsheetId;
  let sheetUrl;

  if (folderId) {
    const created = await createDriveSpreadsheetFile(drive, title, folderId);
    spreadsheetId = created.spreadsheetId;
    sheetUrl = created.sheetUrl;
    await transferDriveOwnershipIfConfigured(drive, spreadsheetId);
    await shareDriveFileWithServiceAccount(drive, spreadsheetId);
    await ensureChildSheetTabs(sheets, spreadsheetId);
  } else {
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [
          { properties: { title: "Leads_Raw", index: 0 } },
          { properties: { title: "Leads_Qualified", index: 1 } },
          { properties: { title: "Leads_Rejected", index: 2 } },
          { properties: { title: "Config", index: 3 } },
          { properties: { title: "Conversations", index: 4 } },
          { properties: { title: "Meetings", index: 5 } },
        ],
      },
    });
    spreadsheetId = spreadsheet.data.spreadsheetId;
    sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: "Leads_Raw!A1:J1",
          values: [[
            "lead_id",
            "campaign_id",
            "nom",
            "site",
            "ville",
            "telephone",
            "rating",
            "reviews_count",
            "maps_url",
            "found_at",
          ]],
        },
        {
          range: `Leads_Qualified!A1:${getColumnLetter(QUALIFIED_HEADER.length)}1`,
          values: [QUALIFIED_HEADER],
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
          values: [CONVERSATIONS_HEADER],
        },
        {
          range: "Meetings!A1:G1",
          values: [MEETINGS_HEADER],
        },
      ],
    },
  });

  await appendValues(sheets, spreadsheetId, "Config!A2:C", [
    ["icp_md", config.icpMd, "ICP smoke staging"],
    ["secteur", config.sector, "Secteur cible"],
    ["villes", config.location, "Villes"],
    ["taille_equipe", "1-20", "Taille equipe cible"],
    ["poste_cible", "Fondateur, CEO", "Poste decideur"],
    ["offre_kames", config.offer, "Offre proposee"],
    ["template_email", "smoke_phase1", "Template smoke"],
    ["score_minimum", "70", "Seuil qualification"],
    ["target_qualified_leads", "1", "Objectif qualifie"],
    ["target_raw_leads", "1", "Objectif raw"],
    ["target_tolerance_percent", "0", "Tolerance"],
    ["estimated_qualification_rate", "1", "Taux qualif estime"],
    ["search_terms", "smoke test", "Termes de recherche"],
    ["search_locations", config.location, "Localisation recherche"],
    ["setter_enabled", "TRUE", "Activer le Setter IA"],
    ["setter_validation", "TRUE", "Validation humaine obligatoire avant envoi"],
    ["setter_validation_locked_until", "", "Date ISO fin warm-up"],
    ["warmup_campaign", "FALSE", "Mode warm-up"],
    ["warmup_started_at", "", "Date warm-up"],
    ["warmup_positive_replies", "0", "Replies positives"],
    ["setter_tone", "formal", "Ton du Setter"],
    ["setter_signature", "Thomas Callendreau, Kames AI", "Signature"],
    ["calendly_event_uri", process.env.CALENDLY_EVENT_TYPE_URI ?? "", "URI Calendly"],
    ["li_caps_daily", "20", "Cap LinkedIn"],
  ]);

  return { spreadsheetId, sheetUrl };
}

async function createLegacySharedCampaign(sheets, campaignId, campaignName, config) {
  const spreadsheetId = requireEnv("GOOGLE_CAMPAIGNS_SHEET_ID");
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const qualifiedTab = `${campaignId}_Qualified`;
  const configTab = `${campaignId}_Config`;

  await ensureSheet(
    sheets,
    spreadsheetId,
    qualifiedTab,
    `'${qualifiedTab}'!A1:${getColumnLetter(QUALIFIED_HEADER.length)}1`,
    QUALIFIED_HEADER,
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    configTab,
    `'${configTab}'!A1:C1`,
    ["param_key", "param_value", "description"],
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Conversations",
    "Conversations!A1:K1",
    CONVERSATIONS_HEADER,
  );
  await ensureSheet(
    sheets,
    spreadsheetId,
    "Meetings",
    "Meetings!A1:G1",
    MEETINGS_HEADER,
  );

  await upsertConfigRows(sheets, spreadsheetId, configTab, config);

  return { spreadsheetId, sheetUrl };
}

async function upsertConfigRows(sheets, spreadsheetId, configTab, config) {
  const desiredRows = [
    ["icp_md", config.icpMd, "ICP smoke staging"],
    ["secteur", config.sector, "Secteur cible"],
    ["villes", config.location, "Villes"],
    ["taille_equipe", "1-20", "Taille equipe cible"],
    ["poste_cible", "Fondateur, CEO", "Poste decideur"],
    ["offre_kames", config.offer, "Offre proposee"],
    ["template_email", "smoke_phase1", "Template smoke"],
    ["score_minimum", "70", "Seuil qualification"],
    ["target_qualified_leads", "1", "Objectif qualifie"],
    ["target_raw_leads", "1", "Objectif raw"],
    ["target_tolerance_percent", "0", "Tolerance"],
    ["estimated_qualification_rate", "1", "Taux qualif estime"],
    ["search_terms", "smoke test", "Termes de recherche"],
    ["search_locations", config.location, "Localisation recherche"],
    ["setter_enabled", "TRUE", "Activer le Setter IA"],
    ["setter_validation", "TRUE", "Validation humaine obligatoire avant envoi"],
    ["setter_validation_locked_until", "", "Date ISO fin warm-up"],
    ["warmup_campaign", "FALSE", "Mode warm-up"],
    ["warmup_started_at", "", "Date warm-up"],
    ["warmup_positive_replies", "0", "Replies positives"],
    ["setter_tone", "formal", "Ton du Setter"],
    ["setter_signature", "Thomas Callendreau, Kames AI", "Signature"],
    ["calendly_event_uri", process.env.CALENDLY_EVENT_TYPE_URI ?? "", "URI Calendly"],
    ["li_caps_daily", "20", "Cap LinkedIn"],
  ];
  const quotedTab = `'${configTab.replace(/'/g, "''")}'`;
  const existingRows = await readRows(sheets, spreadsheetId, `${quotedTab}!A:C`).catch(() => []);
  const existingByKey = new Map(
    existingRows.map((row, index) => [row[0], { row, rowNumber: index + 1 }]),
  );

  for (const row of desiredRows) {
    const existing = existingByKey.get(row[0]);
    if (existing) {
      await updateValues(sheets, spreadsheetId, `${quotedTab}!A${existing.rowNumber}:C${existing.rowNumber}`, [row]);
    } else {
      await appendValues(sheets, spreadsheetId, `${quotedTab}!A:C`, [row]);
    }
  }
}

async function patchConfigRows(sheets, spreadsheetId, configTab, entries) {
  const quotedTab = `'${configTab.replace(/'/g, "''")}'`;
  const existingRows = await readRows(sheets, spreadsheetId, `${quotedTab}!A:C`).catch(() => []);
  const existingByKey = new Map(
    existingRows.map((row, index) => [row[0], { row, rowNumber: index + 1 }]),
  );

  for (const [key, value, description = "Validation M1"] of entries) {
    const row = [key, value, description];
    const existing = existingByKey.get(key);
    if (existing) {
      await updateValues(sheets, spreadsheetId, `${quotedTab}!A${existing.rowNumber}:C${existing.rowNumber}`, [row]);
    } else {
      await appendValues(sheets, spreadsheetId, `${quotedTab}!A:C`, [row]);
    }
  }
}

async function upsertLead(sheets, sheetId, campaignId, leadId, email, options = {}) {
  const tabName = process.env.SMOKE_SHARED_LEGACY === "1" ? `${campaignId}_Qualified` : "Leads_Qualified";
  const quotedTab = `'${tabName.replace(/'/g, "''")}'`;
  const rows = await readRows(sheets, sheetId, `${quotedTab}!A:AG`);
  const existingIndex = rows.findIndex((row, index) => index > 0 && row[0] === leadId);
  const now = new Date().toISOString();
  const leadRow = [
    leadId,
    campaignId,
    "Kames Smoke Fixture",
    "https://kamesai.com",
    "Paris",
    "92",
    "Lead test controle pour smoke M1 Phase 1",
    email,
    "",
    "Thomas",
    "CEO",
    "SaaS",
    "1-20",
    "FALSE",
    "A demande un appel sur les tarifs",
    "croissance",
    "meeting_ready",
    "A repondu au smoke test Setter Phase 1",
    options.statutEmail ?? "replied",
    "80",
    "Site clair, offre B2B",
    "Kames Smoke Fixture",
    "Thomas",
    "Smoke",
    email,
    "test",
    "high",
    "",
    "email",
    "",
    "",
    now,
    "",
  ];

  if (existingIndex > 0) {
    const rowNumber = existingIndex + 1;
    await updateValues(
      sheets,
      sheetId,
      `${quotedTab}!A${rowNumber}:${getColumnLetter(QUALIFIED_HEADER.length)}${rowNumber}`,
      [leadRow],
    );
    return "updated";
  }

  await appendValues(sheets, sheetId, `${quotedTab}!A:AG`, [leadRow]);
  return "created";
}

async function upsertWarmupLeads(sheets, sheetId, campaignId, emails) {
  const statuses = [];
  for (const [index, email] of emails.entries()) {
    const leadId = `${campaignId}_warmup_${String(index + 1).padStart(2, "0")}`;
    const status = await upsertLead(sheets, sheetId, campaignId, leadId, email, {
      statutEmail: "new",
    });
    statuses.push({ lead_id: leadId, email, status });
  }
  return statuses;
}

async function appendGraduationTurns(sheets, sheetId, campaignId, accuracyTarget) {
  const runId = makeId("graduation");
  const correctCount = Math.round(50 * accuracyTarget);
  const now = Date.now();
  const rows = Array.from({ length: 50 }, (_, index) => {
    const isCorrect = index < correctCount;
    const intent = GRADUATION_INTENTS[index % GRADUATION_INTENTS.length];
    const humanLabel = isCorrect
      ? intent
      : GRADUATION_INTENTS[(index + 1) % GRADUATION_INTENTS.length];
    const sentAt = new Date(now - (50 - index) * 60_000).toISOString();
    return [
      `${runId}_turn_${String(index + 1).padStart(2, "0")}`,
      `${campaignId}_graduation_lead`,
      "email",
      "setter",
      `Draft de validation M1 ${index + 1}`,
      sentAt,
      intent,
      "human",
      isCorrect ? "false" : "true",
      `graduation_smoke,accuracy_${Math.round(accuracyTarget * 100)}`,
      humanLabel,
    ];
  });

  await appendValues(sheets, sheetId, "Conversations!A:K", rows);
  return { run_id: runId, rows: rows.length, correct: correctCount };
}

async function main() {
  if (process.argv.includes("--list-candidates")) {
    const { sheets } = await getClients();
    const rows = await readRows(sheets, requireEnv("GOOGLE_INDEX_SHEET_ID"), "Campagnes!A:N");
    const candidates = rows
      .slice(1)
      .filter((row) => /smoke|test|staging|phase|m1/i.test(row[1] ?? ""))
      .map((row) => ({
        campaign_id: row[0] ?? "",
        name: row[1] ?? "",
        status: row[7] ?? "",
        sheet_id: row[2] ?? "",
        sheet_url: row[3] ?? "",
      }));
    console.log(JSON.stringify(candidates, null, 2));
    return;
  }

  const mode = process.env.SMOKE_MODE ?? "phase1";
  const campaignName =
    process.env.SMOKE_CAMPAIGN_NAME ??
    (mode === "warmup"
      ? "SMOKE M1 Phase 1 - warmup real"
      : mode === "graduation"
        ? "SMOKE M1 Phase 1 - graduation"
        : "SMOKE M1 Phase 1 - staging");
  const smokeEmail = process.env.SMOKE_FROM_EMAIL ?? "thomas+smoke@kamesai.com";
  const workspaceId = process.env.SMOKE_WORKSPACE_ID ?? "kames-default";
  const warmupEmails = parseCsv(process.env.WARMUP_EMAILS);
  const graduationAccuracy = Number.parseFloat(process.env.GRADUATION_ACCURACY ?? "0.9");
  const graduationLockedUntilDaysAgo = Number.parseInt(
    process.env.GRADUATION_LOCKED_UNTIL_DAYS_AGO ?? (graduationAccuracy < 0.85 ? "22" : "1"),
    10,
  );
  const config = {
    sector: "SaaS B2B",
    location: "Paris",
    offer: "Audit IA pour automatiser la qualification et la prise de rendez-vous",
    icpMd: "Fixture staging pour valider WF7, WF8, inbox, Resend et Calendly sans prospect reel.",
  };

  const { sheets, drive } = await getClients();
  const existing = await findExistingCampaign(sheets, campaignName);
  let campaignId;
  let sheetId;
  let sheetUrl;
  let campaignStatus = "reused";

  if (existing) {
    campaignId = existing[0];
    sheetId = existing[2];
    sheetUrl = existing[3];
    process.env.SMOKE_SHARED_LEGACY =
      sheetId === process.env.GOOGLE_CAMPAIGNS_SHEET_ID ? "1" : "0";
    if (process.env.SMOKE_SHARED_LEGACY === "1") {
      await upsertConfigRows(sheets, sheetId, `${campaignId}_Config`, config);
    }
  } else {
    campaignId = process.env.SMOKE_CAMPAIGN_ID ?? makeId("smoke_m1");
    let child;
    try {
      child = await createChildSheet(sheets, drive, campaignId, campaignName, config);
      process.env.SMOKE_SHARED_LEGACY = "0";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/permission/i.test(message)) throw error;
      console.warn(`Dedicated child sheet creation skipped: ${message}`);
      child = await createLegacySharedCampaign(sheets, campaignId, campaignName, config);
      process.env.SMOKE_SHARED_LEGACY = "1";
    }
    sheetId = child.spreadsheetId;
    sheetUrl = child.sheetUrl;
    campaignStatus = "created";
    await appendValues(sheets, requireEnv("GOOGLE_INDEX_SHEET_ID"), "Campagnes!A:N", [[
      campaignId,
      campaignName,
      sheetId,
      sheetUrl,
      config.sector,
      config.location,
      config.offer,
      "active",
      new Date().toISOString().slice(0, 10),
      "1",
      "1",
      "0",
      "0",
      workspaceId,
    ]]);
  }

  const leadId = process.env.SMOKE_LEAD_ID ?? `${campaignId}_lead_smoke_001`;
  const leadStatus = await upsertLead(sheets, sheetId, campaignId, leadId, smokeEmail);
  const configTab = process.env.SMOKE_SHARED_LEGACY === "1" ? `${campaignId}_Config` : "Config";
  let warmupLeadStatuses = [];
  let graduationTurns = null;

  if (mode === "warmup") {
    if (warmupEmails.length === 0) {
      throw new Error("WARMUP_EMAILS doit contenir au moins une adresse en mode warmup");
    }
    await patchConfigRows(sheets, sheetId, configTab, [
      ["warmup_campaign", "TRUE", "Mode warm-up reel controle"],
      ["warmup_started_at", new Date().toISOString(), "Date demarrage warm-up reel"],
      ["warmup_positive_replies", "0", "Replies positives taggees"],
      ["setter_validation", "TRUE", "Validation humaine obligatoire pendant warm-up"],
      ["setter_validation_locked_until", daysAgoIso(-14), "Fin lock validation apres warm-up"],
      ["target_qualified_leads", String(warmupEmails.length), "Nombre contacts warm-up disponibles"],
      ["target_raw_leads", String(warmupEmails.length), "Nombre contacts warm-up disponibles"],
    ]);
    warmupLeadStatuses = await upsertWarmupLeads(sheets, sheetId, campaignId, warmupEmails);
  }

  if (mode === "graduation") {
    if (!Number.isFinite(graduationAccuracy) || graduationAccuracy < 0 || graduationAccuracy > 1) {
      throw new Error("GRADUATION_ACCURACY doit etre compris entre 0 et 1");
    }
    await patchConfigRows(sheets, sheetId, configTab, [
      ["warmup_campaign", "FALSE", "Warm-up termine pour smoke graduation"],
      ["warmup_started_at", daysAgoIso(16), "Date demarrage warm-up smoke"],
      ["warmup_completed_at", daysAgoIso(1), "Date fin warm-up smoke"],
      ["warmup_positive_replies", "3", "Replies positives smoke"],
      ["setter_validation", "TRUE", "Validation humaine avant graduation"],
      [
        "setter_validation_locked_until",
        daysAgoIso(graduationLockedUntilDaysAgo),
        "Lock validation expire pour smoke graduation",
      ],
    ]);
    graduationTurns = await appendGraduationTurns(sheets, sheetId, campaignId, graduationAccuracy);
  }

  const result = {
    mode,
    campaign_status: campaignStatus,
    campaign_id: campaignId,
    campaign_name: campaignName,
    sheet_id: sheetId,
    sheet_url: sheetUrl,
    lead_status: leadStatus,
    lead_id: leadId,
    smoke_from_email: smokeEmail,
    smoke_to_email: process.env.SMOKE_TO_EMAIL ?? process.env.RESEND_FROM ?? "thomas@outreach.kamesai.com",
    warmup_contacts: warmupLeadStatuses.length,
    warmup_leads: warmupLeadStatuses.map(({ lead_id, status }) => ({ lead_id, status })),
    graduation_accuracy_target: mode === "graduation" ? graduationAccuracy : undefined,
    graduation_turns: graduationTurns,
    wf7_webhook_configured: Boolean(process.env.N8N_WF7_WEBHOOK),
    wf8_webhook_configured: Boolean(process.env.N8N_WF8_WEBHOOK),
    calendly_event_configured: Boolean(process.env.CALENDLY_EVENT_TYPE_URI),
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
