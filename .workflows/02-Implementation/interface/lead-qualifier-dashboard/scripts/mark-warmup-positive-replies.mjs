#!/usr/bin/env node
import fs from "node:fs";
import { google } from "googleapis";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadEnv(".env.local");
loadEnv("../../../../.env.local");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

async function getSheets() {
  if (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  ) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    );
    client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
    return google.sheets({ version: "v4", auth: client });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: await auth.getClient() });
}

async function ensureConversationsHeader(sheets, sheetId) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Conversations!A1:K1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
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
      ]],
    },
  });
}

async function upsertConfigValue(sheets, sheetId, key, value) {
  const rows = (await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Config!A:C",
  })).data.values ?? [];
  const existingIndex = rows.findIndex((row) => row[0] === key);
  const row = [key, value, "Validation warm-up M1"];

  if (existingIndex >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Config!A${existingIndex + 1}:C${existingIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Config!A:C",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  }
}

const sheetId = requireEnv("SHEET_ID");
const campaignId = requireEnv("CAMPAIGN_ID");
const count = Number.parseInt(process.env.REPLY_COUNT ?? "5", 10);
const now = new Date().toISOString();
const sheets = await getSheets();

await ensureConversationsHeader(sheets, sheetId);

const existingRows = (await sheets.spreadsheets.values.get({
  spreadsheetId: sheetId,
  range: "Conversations!A:K",
}).catch(() => ({ data: { values: [] } }))).data.values ?? [];
const existingTurnIds = new Set(existingRows.slice(1).map((row) => row[0]));
const rows = [];

for (let index = 1; index <= count; index += 1) {
  const leadId = `${campaignId}_warmup_${String(index).padStart(2, "0")}`;
  const turnId = `${campaignId}_warmup_positive_${String(index).padStart(2, "0")}`;
  if (existingTurnIds.has(turnId)) continue;
  rows.push([
    turnId,
    leadId,
    "email",
    "prospect",
    "Reply positive warm-up confirmée manuellement par Thomas.",
    now,
    "interested",
    "manual",
    "false",
    "warmup_positive_reply,manual_confirmation",
    "interested",
  ]);
}

if (rows.length > 0) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Conversations!A:K",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

await upsertConfigValue(sheets, sheetId, "warmup_positive_replies", String(count));

console.log(JSON.stringify({
  sheet_id: sheetId,
  campaign_id: campaignId,
  reply_count: count,
  appended_turns: rows.length,
}, null, 2));
