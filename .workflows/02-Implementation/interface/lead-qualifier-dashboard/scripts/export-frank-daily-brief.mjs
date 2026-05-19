import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { google } from "googleapis";

loadDotEnvLocal();

const DEFAULT_OUTPUT_PATH = "/home/kames/KamesOS/data/flinty/daily-pipeline.json";
const OUTPUT_PATH = process.env.FRANK_DAILY_BRIEF_OUTPUT || DEFAULT_OUTPUT_PATH;

if (
  !process.env.FRANK_DAILY_BRIEF_OUTPUT &&
  process.platform === "darwin" &&
  OUTPUT_PATH.startsWith("/home/")
) {
  console.error(
    JSON.stringify({
      ok: false,
      error:
        "Sur macOS, le chemin par défaut /home/kames/... n'existe pas. " +
        "Définir FRANK_DAILY_BRIEF_OUTPUT ou utiliser : npm run sync:frank-daily-brief",
    })
  );
  process.exit(1);
}
const INDEX_SHEET_ID = process.env.GOOGLE_INDEX_SHEET_ID;
const MAX_SECTION_LEADS = 25;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function loadDotEnvLocal() {
  if (!existsSync(".env.local")) return;
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function getSheets() {
  const auth = await getAuth().getClient();
  return google.sheets({ version: "v4", auth });
}

async function readSheet(sheets, spreadsheetId, range) {
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return response.data.values || [];
}

async function readChildQualifiedLeads(sheets, sheetId, campaignId) {
  try {
    return await readSheet(sheets, sheetId, quoteRange(`${campaignId}_Qualified`, "A1:AB5000"));
  } catch (error) {
    if (!String(error?.message || "").includes("Unable to parse range")) throw error;
    return readSheet(sheets, sheetId, quoteRange("Leads_Qualified", "A1:AB5000"));
  }
}

async function readConversations(sheets, sheetId) {
  try {
    return parseConversationRows(await readSheet(sheets, sheetId, "Conversations!A1:K5000"));
  } catch {
    return [];
  }
}

async function main() {
  if (!INDEX_SHEET_ID) throw new Error("GOOGLE_INDEX_SHEET_ID manquant");

  const sheets = await getSheets();
  const campaigns = parseIndexCampaigns(await readSheet(sheets, INDEX_SHEET_ID, "Campagnes!A:N"))
    .filter((campaign) => campaign.sheet_id);
  const payloads = await Promise.all(
    campaigns.map(async (campaign) => {
      const [leadRows, turns] = await Promise.all([
        readChildQualifiedLeads(sheets, campaign.sheet_id, campaign.campaign_id).catch(() => []),
        readConversations(sheets, campaign.sheet_id),
      ]);
      return {
        campaign,
        leads: parseBriefSourceLeads(leadRows),
        turns,
      };
    })
  );

  const data = buildBrief({
    now: new Date(),
    campaigns,
    leadsByCampaign: Object.fromEntries(
      payloads.map((payload) => [payload.campaign.campaign_id, payload.leads])
    ),
    conversationsByCampaign: Object.fromEntries(
      payloads.map((payload) => [payload.campaign.campaign_id, payload.turns])
    ),
  });

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, output_path: OUTPUT_PATH, date: data.date, counts: data.summary }));
}

function buildBrief(source) {
  const now = source.now || new Date();
  const since = now.getTime() - 24 * 60 * 60 * 1000;
  const contexts = source.campaigns.flatMap((campaign) =>
    (source.leadsByCampaign[campaign.campaign_id] || []).map((lead) => {
      const turns = (source.conversationsByCampaign[campaign.campaign_id] || [])
        .filter((turn) => turn.lead_id === lead.lead_id)
        .sort((a, b) => toTime(a.sent_at) - toTime(b.sent_at));
      return { campaign, lead, turns };
    })
  );

  const newReplies = contexts
    .filter(({ lead, turns }) => toTime(lead.reply_at) >= since || toTime(lastTurn(turns, "prospect")?.sent_at) >= since)
    .map(({ campaign, lead, turns }) => toBriefLead(campaign, lead, turns, "Réponse prospect reçue sur les dernières 24h", now));
  const followups = contexts
    .filter(({ lead, turns }) => {
      const status = lead.statut_email.toLowerCase();
      return lead.setter_action.toLowerCase() === "escalated" ||
        lastTurn(turns)?.role === "prospect" ||
        ["contacted", "relance_1", "relance_2", "opened", "clicked"].includes(status);
    })
    .map(({ campaign, lead, turns }) => toBriefLead(campaign, lead, turns, "Action commerciale à reprendre ou relance à préparer", now));
  const blocked = contexts
    .filter(({ campaign, lead, turns }) => {
      if (["generating", "paused"].includes(campaign.statut)) return true;
      if (lead.setter_action.toLowerCase().includes("blocked")) return true;
      const lastInteractionAt = Math.max(toTime(lead.reply_at), toTime(lastTurn(turns)?.sent_at));
      return lastInteractionAt > 0 && now.getTime() - lastInteractionAt >= 7 * 24 * 60 * 60 * 1000;
    })
    .map(({ campaign, lead, turns }) => toBriefLead(campaign, lead, turns, "Lead bloqué, campagne pausée ou interaction ancienne", now));
  const optionalDrafts = contexts
    .filter(({ lead, turns }) => !followups.some((item) => item.id === lead.lead_id) && (lead.statut_email.toLowerCase() === "new" || turns.length === 0))
    .sort((a, b) => Number(b.lead.score || 0) - Number(a.lead.score || 0))
    .map(({ campaign, lead, turns }) => toBriefLead(campaign, lead, turns, "Lead qualifié sans draft prioritaire", now));

  return {
    date: now.toISOString().slice(0, 10),
    summary: {
      active_campaigns: source.campaigns.filter((campaign) => campaign.statut === "active").length,
      qualified_leads: contexts.length,
      new_replies: newReplies.length,
      followups_due: followups.length,
      blocked_or_stale: blocked.length,
      optional_drafts_to_prepare: optionalDrafts.length,
    },
    priorities: uniqueLeads([...newReplies, ...followups, ...blocked]).sort(prioritySort).slice(0, MAX_SECTION_LEADS),
    followups_due: uniqueLeads(followups).slice(0, MAX_SECTION_LEADS),
    new_replies: uniqueLeads(newReplies).slice(0, MAX_SECTION_LEADS),
    blocked_or_stale: uniqueLeads(blocked).slice(0, MAX_SECTION_LEADS),
    market_signals: buildMarketSignals(contexts),
    optional_drafts_to_prepare: uniqueLeads(optionalDrafts).slice(0, MAX_SECTION_LEADS),
  };
}

function parseIndexCampaigns(rows) {
  return rows.slice(1).filter((row) => row[0]).map((row) => ({
    campaign_id: row[0] || "",
    nom: row[1] || "",
    sheet_id: row[2] || "",
    secteur: row[4] || "",
    localisation: row[5] || "",
    offre_kames: row[6] || "",
    statut: row[7] || "paused",
    date_création: row[8] || "",
    total_leads_raw: row[9] || "0",
    total_leads_qualified: row[10] || "0",
    emails_envoyés: row[11] || "0",
    taux_réponse: row[12] || "0",
    workspace_id: row[13] || "kames-default",
  }));
}

function parseBriefSourceLeads(rows) {
  const data = rows[0]?.[0] === "lead_id" ? rows.slice(1) : rows;
  return data.filter((row) => row[0]).map((row) => ({
    lead_id: row[0] || "",
    campaign_id: row[1] || "",
    company: row[21] || row[2] || "",
    contact_name: [row[22] || row[9], row[23]].filter(Boolean).join(" ").trim(),
    score: row[5] || "0",
    score_reason: row[6] || "",
    statut_email: row[18] || "new",
    hiring_signals: row[14] || "",
    growth_stage: row[15] || "",
    buying_signal: row[16] || "",
    personalized_hook: row[17] || "",
    source_channel: row[28] || "",
    statut_li: row[29] || "",
    reply_intent: row[30] || "",
    reply_at: row[31] || "",
    setter_action: row[32] || "",
  }));
}

function parseConversationRows(rows) {
  return rows.slice(1).filter((row) => row[0]).map((row) => ({
    turn_id: row[0] || "",
    lead_id: row[1] || "",
    channel: row[2] || "email",
    role: row[3] || "prospect",
    content: row[4] || "",
    sent_at: row[5] || "",
    intent: row[6] || "",
    validated_by: row[7] || "",
    edited_from_draft: row[8] || "false",
    tags: row[9] || "",
  }));
}

function toBriefLead(campaign, lead, turns, reason, now) {
  const last = lastTurn(turns);
  const lastProspect = lastTurn(turns, "prospect");
  return removeEmptyValues({
    id: lead.lead_id,
    company: lead.company || campaign.nom,
    contact_name: lead.contact_name || undefined,
    stage: stageFor(campaign, lead, last),
    temperature: temperatureFor(lead, lastProspect),
    reason: compactText(reason, 220),
    last_interaction: newestDate(lead.reply_at, last?.sent_at),
    next_action_due: nextActionFor(lead, last, now),
    recommended_action: recommendedActionFor(campaign, lead, last),
    channel: channelFor(lead, turns),
    message_summary: messageSummaryFor(lead, lastProspect),
  });
}

function stageFor(campaign, lead, last) {
  if (["generating", "paused"].includes(campaign.statut)) return "blocked";
  if (lead.setter_action.toLowerCase().includes("blocked")) return "blocked";
  if (last?.role === "prospect" || lead.statut_email.toLowerCase() === "replied") return "replied";
  if (lead.reply_intent === "meeting_ready") return "meeting_ready";
  if (lead.statut_email.toLowerCase().startsWith("relance")) return "followup";
  if (lead.statut_email.toLowerCase() === "contacted") return "contacted";
  if (lead.statut_email.toLowerCase() === "new") return "new";
  return "unknown";
}

function temperatureFor(lead, lastProspect) {
  if (["meeting_ready", "interested"].includes(lastProspect?.intent) || ["meeting_ready", "interested"].includes(lead.reply_intent)) return "hot";
  const score = Number(lead.score || 0);
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  if (score > 0) return "cold";
  return "unknown";
}

function recommendedActionFor(campaign, lead, last) {
  if (["generating", "paused"].includes(campaign.statut)) return "Vérifier le blocage campagne avant action.";
  if (lead.setter_action.toLowerCase() === "escalated") return "Traiter manuellement la conversation escaladée.";
  if (last?.role === "prospect") return "Préparer une réponse contextualisée pour validation.";
  if (lead.statut_email.toLowerCase() === "new") return "Préparer un premier message sobre et personnalisé.";
  return "Préparer ou vérifier la prochaine relance.";
}

function nextActionFor(lead, last, now) {
  return lead.setter_action.toLowerCase() === "escalated" || last?.role === "prospect"
    ? now.toISOString().slice(0, 10)
    : null;
}

function channelFor(lead, turns) {
  const channels = new Set(turns.map((turn) => turn.channel));
  if (channels.size > 1) return "mixed";
  if (channels.has("linkedin")) return "linkedin";
  if (channels.has("email")) return "email";
  const source = lead.source_channel.toLowerCase();
  if (source.includes("linkedin")) return "linkedin";
  if (source.includes("email")) return "email";
  return "unknown";
}

function messageSummaryFor(lead, lastProspect) {
  const value = compactText([
    lead.reply_intent && `Intent: ${lead.reply_intent}`,
    lead.buying_signal && `Signal: ${lead.buying_signal}`,
    lead.personalized_hook && `Hook: ${lead.personalized_hook}`,
    lastProspect?.content && `Dernier message: ${lastProspect.content}`,
  ].filter(Boolean).join(" | "), 360);
  return value || undefined;
}

function buildMarketSignals(contexts) {
  const counts = new Map();
  for (const { campaign, lead } of contexts) {
    for (const signal of [lead.buying_signal, lead.hiring_signals, lead.growth_stage]) {
      const clean = compactText(signal, 140);
      if (!clean) continue;
      const key = `${campaign.secteur || "Marché"}: ${clean}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([signal, count]) => count > 1 ? `${signal} (${count})` : signal);
}

function quoteRange(sheetName, range) {
  return `'${sheetName.replace(/'/g, "''")}'!${range}`;
}

function prioritySort(a, b) {
  const weight = { hot: 3, warm: 2, cold: 1, unknown: 0 };
  return weight[b.temperature] - weight[a.temperature];
}

function uniqueLeads(leads) {
  const seen = new Set();
  return leads.filter((lead) => {
    if (seen.has(lead.id)) return false;
    seen.add(lead.id);
    return true;
  });
}

function lastTurn(turns, role) {
  return [...turns].reverse().find((turn) => !role || turn.role === role);
}

function newestDate(...values) {
  const newest = values.map(toTime).filter(Boolean).sort((a, b) => b - a)[0];
  return newest ? new Date(newest).toISOString() : null;
}

function toTime(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compactText(value, maxLength) {
  const clean = sanitizeText(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function sanitizeText(value) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email_redacted]")
    .replace(/https?:\/\/\S+/gi, "[url_redacted]")
    .replace(/\b(?:bearer|token|api[_ -]?key|secret|password|cookie)\s*[:=]\s*\S+/gi, "[secret_redacted]")
    .replace(/\b(?:\+?\d[\d .()-]{7,}\d)\b/g, "[phone_redacted]");
}

function removeEmptyValues(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ""));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown export error" }));
  process.exit(1);
});
