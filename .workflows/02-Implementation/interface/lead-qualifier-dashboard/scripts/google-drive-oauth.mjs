#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(dashboardRoot, "../../../..");
const redirectPath = "/oauth2callback";
const port = Number(process.env.GOOGLE_OAUTH_PORT ?? "53682");
const redirectUri = `http://127.0.0.1:${port}${redirectPath}`;
const scopes = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

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

function quoteEnvValue(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function upsertEnvValue(filePath, key, value) {
  const line = `${key}=${quoteEnvValue(value)}`;
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const next = pattern.test(content)
    ? content.replace(pattern, line)
    : `${content}${content && !content.endsWith("\n") ? "\n" : ""}${line}\n`;
  fs.writeFileSync(filePath, next);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant dans .env.local`);
  return value;
}

function getOAuthClient() {
  return new google.auth.OAuth2(
    requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
    requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    redirectUri,
  );
}

function printSetup() {
  console.log(`
Google Drive OAuth setup

1. Google Cloud Console > APIs & Services > OAuth consent screen
   - User type: External
   - Publishing status: Testing is OK
   - Test users: add your Gmail address
   - Scopes: Drive + Sheets

2. APIs & Services > Credentials > Create credentials > OAuth client ID
   - Application type: Web application
   - Authorized redirect URI: ${redirectUri}

3. Add these two values to .env.local at repo root and dashboard:
   GOOGLE_OAUTH_CLIENT_ID="..."
   GOOGLE_OAUTH_CLIENT_SECRET="..."

4. Run:
   node scripts/google-drive-oauth.mjs serve
`);
}

async function serve() {
  const client = getOAuthClient();
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  await new Promise((resolve, reject) => {
    const server = http.createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url ?? "/", redirectUri);
        if (requestUrl.pathname !== redirectPath) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }

        const code = requestUrl.searchParams.get("code");
        const error = requestUrl.searchParams.get("error");
        if (error) throw new Error(`Google OAuth error: ${error}`);
        if (!code) throw new Error("Callback sans code OAuth.");

        const { tokens } = await client.getToken(code);
        if (!tokens.refresh_token) {
          throw new Error(
            "Google n'a pas renvoye de refresh_token. Relance avec consentement force ou supprime l'acces existant dans ton compte Google.",
          );
        }

        for (const envPath of [
          path.join(repoRoot, ".env.local"),
          path.join(dashboardRoot, ".env.local"),
        ]) {
          upsertEnvValue(envPath, "GOOGLE_OAUTH_REFRESH_TOKEN", tokens.refresh_token);
        }

        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("OK. Refresh token saved in .env.local. You can close this tab.");
        server.close(() => resolve(undefined));
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(error instanceof Error ? error.message : String(error));
        server.close(() => reject(error));
      }
    });

    server.listen(port, "127.0.0.1", () => {
      console.log("Open this URL in your Gmail browser session:\n");
      console.log(authUrl);
      console.log("\nWaiting for Google callback...");
    });
  });
}

async function main() {
  loadEnvFile(path.join(repoRoot, ".env.local"));
  loadEnvFile(path.join(dashboardRoot, ".env.local"));

  const command = process.argv[2] ?? "setup";
  if (command === "setup" || command === "--help" || command === "-h") {
    printSetup();
    return;
  }
  if (command === "serve") {
    await serve();
    return;
  }
  throw new Error(`Commande inconnue: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
