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

function columnLetter(index) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const mod = (value - 1) % 26;
    result = String.fromCharCode(65 + mod) + result;
    value = Math.floor((value - mod) / 26);
  }
  return result;
}

const sheetId = requireEnv("SHEET_ID");
const campaignId = requireEnv("CAMPAIGN_ID");
const prefix = `${campaignId}_warmup_`;
const now = new Date().toISOString();
const sheets = await getSheets();
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: sheetId,
  range: "Leads_Qualified!A1:AG5000",
});
const rows = response.data.values ?? [];
const headers = rows[0] ?? [];
const leadIdCol = headers.indexOf("lead_id");
const statusCol = headers.indexOf("statut_email");
const sentAtCol = headers.indexOf("last_email_sent_at");
const resendCol = headers.indexOf("resend_email_id");

if (leadIdCol === -1 || statusCol === -1) {
  throw new Error("Colonnes lead_id/statut_email introuvables");
}

let updated = 0;
for (let index = 1; index < rows.length; index += 1) {
  const row = rows[index] ?? [];
  if (!String(row[leadIdCol] ?? "").startsWith(prefix)) continue;
  const rowNumber = index + 1;
  const data = [
    {
      range: `Leads_Qualified!${columnLetter(statusCol)}${rowNumber}`,
      values: [["contacted"]],
    },
  ];
  if (sentAtCol !== -1) {
    data.push({
      range: `Leads_Qualified!${columnLetter(sentAtCol)}${rowNumber}`,
      values: [[now]],
    });
  }
  if (resendCol !== -1) {
    data.push({
      range: `Leads_Qualified!${columnLetter(resendCol)}${rowNumber}`,
      values: [["sent_by_wf3_execution_5445"]],
    });
  }
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data },
  });
  updated += 1;
}

console.log(JSON.stringify({ sheet_id: sheetId, campaign_id: campaignId, updated }, null, 2));
