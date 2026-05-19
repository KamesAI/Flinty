/**
 * Exporte le daily brief Frank localement puis l'uploade sur le VPS via rsync/scp.
 * Variables requises : FLINTY_FRANK_SSH_HOST
 * Variables optionnelles : FLINTY_FRANK_REMOTE_PATH, FLINTY_FRANK_LOCAL_OUTPUT, FLINTY_FRANK_LOG_PATH
 * Aucun secret ne doit apparaître dans les logs.
 */

import { mkdir, writeFile, readFile, appendFile } from "node:fs/promises";
import { existsSync, statSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

loadEnvFile(".env.frank");
loadEnvFile(".env.local");

const SSH_HOST = process.env.FLINTY_FRANK_SSH_HOST;
const REMOTE_PATH =
  process.env.FLINTY_FRANK_REMOTE_PATH ||
  "/home/kames/KamesOS/data/flinty/daily-pipeline.json";
const LOCAL_OUTPUT = resolve(
  process.env.FLINTY_FRANK_LOCAL_OUTPUT || "./tmp/frank/daily-pipeline.json"
);
const LOG_PATH = resolve(
  process.env.FLINTY_FRANK_LOG_PATH || "./tmp/frank/frank-daily-brief-sync.log"
);

const EXPORT_SCRIPT = resolve("./scripts/export-frank-daily-brief.mjs");

// Patterns indiquant un JSON contaminé par des secrets
const SECRET_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\b(?:bearer|password|api[_ -]?key|cookie)\s*[:=]\s*\S+/gi,
  /\beyJ[A-Za-z0-9_-]{10,}/g,
];
const PHONE_PATTERN = /\b(?:\+?\d[\d .()-]{9,}\d)\b/g;

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  try {
    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const sep = trimmed.indexOf("=");
      if (sep <= 0) continue;
      const key = trimmed.slice(0, sep).trim();
      if (process.env[key] !== undefined) continue;
      let value = trimmed.slice(sep + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // fichier absent ou illisible — non bloquant
  }
}

async function log(level, message, extra = {}) {
  const ts = new Date().toISOString();
  const safeExtra = JSON.stringify(
    Object.fromEntries(
      Object.entries(extra).filter(
        ([k]) => !/(key|token|secret|password|bearer|cookie)/i.test(k)
      )
    )
  );
  const line =
    `${ts} [${level}] ${message} ${safeExtra !== "{}" ? safeExtra : ""}`.trimEnd();
  console.log(line);
  try {
    await mkdir(dirname(LOG_PATH), { recursive: true });
    await appendFile(LOG_PATH, `${line}\n`, "utf8");
  } catch {
    // échec log disque non fatal
  }
}

function scanForSecrets(content) {
  const issues = [];
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      issues.push(`pattern interdit: ${pattern.source.slice(0, 40)}`);
    }
  }
  const phones = content.match(PHONE_PATTERN) ?? [];
  if (phones.length > 0 && !content.includes("[phone_redacted]")) {
    issues.push(`${phones.length} numéro(s) de téléphone non-redactés`);
  }
  return issues;
}

async function runExport() {
  await log("INFO", "Lancement export daily brief", { script: EXPORT_SCRIPT });

  const env = { ...process.env, FRANK_DAILY_BRIEF_OUTPUT: LOCAL_OUTPUT };
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [EXPORT_SCRIPT],
    { env, timeout: 120_000 }
  );

  if (stderr?.trim()) {
    await log("WARN", "Export stderr", { stderr: stderr.trim().slice(0, 200) });
  }

  let result;
  try {
    result = JSON.parse(stdout.trim());
  } catch {
    throw new Error(`Export stdout non-parsable: ${stdout.trim().slice(0, 200)}`);
  }

  if (!result.ok) {
    throw new Error(`Export échoué: ${result.error ?? "unknown"}`);
  }

  await log("INFO", "Export terminé", { date: result.date, counts: result.counts });
}

async function validateJson() {
  if (!existsSync(LOCAL_OUTPUT)) {
    throw new Error(`Fichier local absent: ${LOCAL_OUTPUT}`);
  }

  const content = await readFile(LOCAL_OUTPUT, "utf8");
  if (!content.trim()) throw new Error("JSON local vide");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`JSON invalide: ${err.message}`);
  }

  if (!parsed.date || typeof parsed.summary !== "object") {
    throw new Error("JSON mal formé : champs date/summary absents");
  }

  const issues = scanForSecrets(content);
  if (issues.length > 0) {
    throw new Error(`Scan sécurité échoué — ${issues.join("; ")}`);
  }

  const stat = statSync(LOCAL_OUTPUT);
  await log("INFO", "JSON validé", { size_bytes: stat.size, date: parsed.date });
  return { size: stat.size, date: parsed.date };
}

async function which(cmd) {
  try {
    const { stdout } = await execFileAsync("which", [cmd]);
    return stdout.trim() !== "";
  } catch {
    return false;
  }
}

async function sshMkdir() {
  const remoteDir = REMOTE_PATH.split("/").slice(0, -1).join("/");
  await log("INFO", "Création dossier distant", { remoteDir });
  await execFileAsync("ssh", [SSH_HOST, `mkdir -p '${remoteDir}'`], {
    timeout: 30_000,
  });
}

async function upload() {
  if (await which("rsync")) {
    await log("INFO", "Upload via rsync");
    await execFileAsync(
      "rsync",
      ["-az", "--checksum", LOCAL_OUTPUT, `${SSH_HOST}:${REMOTE_PATH}`],
      { timeout: 60_000 }
    );
  } else {
    await log("INFO", "rsync absent — fallback scp");
    await execFileAsync("scp", [LOCAL_OUTPUT, `${SSH_HOST}:${REMOTE_PATH}`], {
      timeout: 60_000,
    });
  }
}

async function verifyRemote() {
  const { stdout } = await execFileAsync(
    "ssh",
    [SSH_HOST, `test -s '${REMOTE_PATH}' && wc -c < '${REMOTE_PATH}'`],
    { timeout: 30_000 }
  );
  const bytes = parseInt(stdout.trim(), 10);
  if (!bytes || bytes < 10) {
    throw new Error(`Fichier distant vide ou absent: ${REMOTE_PATH}`);
  }
  await log("INFO", "Vérification VPS OK", {
    remote_path: REMOTE_PATH,
    remote_bytes: bytes,
  });
  return bytes;
}

async function main() {
  await log("INFO", "=== sync-frank-daily-brief démarré ===");

  if (!SSH_HOST) {
    await log(
      "ERROR",
      "FLINTY_FRANK_SSH_HOST non défini. Créer .env.frank (voir .env.frank.example)."
    );
    process.exit(1);
  }

  await mkdir(dirname(LOCAL_OUTPUT), { recursive: true });

  await runExport();
  const { size } = await validateJson();
  await sshMkdir();
  await upload();
  const remoteBytes = await verifyRemote();

  await log("INFO", "=== SYNC OK ===", {
    local_path: LOCAL_OUTPUT,
    remote: `${SSH_HOST}:${REMOTE_PATH}`,
    local_bytes: size,
    remote_bytes: remoteBytes,
  });
}

main().catch(async (err) => {
  await log("ERROR", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
