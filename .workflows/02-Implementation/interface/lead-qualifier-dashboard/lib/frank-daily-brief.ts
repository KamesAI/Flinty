import { getAllConversationTurns, type ConversationTurn } from "./conversations";
import {
  QUALIFIED_SHEET_RANGE_WITH_HEADER,
  parseIndexCampaigns,
  readChildQualifiedLeads,
  readIndex,
  type IndexCampaign,
} from "./sheets";

export const DEFAULT_FRANK_DAILY_BRIEF_OUTPUT_PATH =
  "/home/kames/KamesOS/data/flinty/daily-pipeline.json";

const MAX_SECTION_LEADS = 25;

export type FrankBriefLeadStage =
  | "new"
  | "contacted"
  | "followup"
  | "replied"
  | "meeting_ready"
  | "blocked"
  | "stale"
  | "unknown";

export interface FrankBriefLead {
  id: string;
  company: string;
  contact_name?: string;
  stage: FrankBriefLeadStage;
  temperature: "hot" | "warm" | "cold" | "unknown";
  reason: string;
  last_interaction: string | null;
  next_action_due: string | null;
  recommended_action: string;
  channel: "email" | "linkedin" | "mixed" | "unknown";
  message_summary?: string;
}

export interface DailyPipelineBriefData {
  date: string;
  summary: {
    active_campaigns: number;
    qualified_leads: number;
    new_replies: number;
    followups_due: number;
    blocked_or_stale: number;
    optional_drafts_to_prepare: number;
  };
  priorities: FrankBriefLead[];
  followups_due: FrankBriefLead[];
  new_replies: FrankBriefLead[];
  blocked_or_stale: FrankBriefLead[];
  market_signals: string[];
  optional_drafts_to_prepare: FrankBriefLead[];
}

interface BriefSourceLead {
  lead_id: string;
  campaign_id: string;
  company: string;
  contact_name: string;
  score: string;
  score_reason: string;
  statut_email: string;
  hiring_signals: string;
  growth_stage: string;
  buying_signal: string;
  personalized_hook: string;
  source_channel: string;
  statut_li: string;
  reply_intent: string;
  reply_at: string;
  setter_action: string;
}

export interface DailyPipelineBriefSource {
  now?: Date;
  campaigns: IndexCampaign[];
  leadsByCampaign: Record<string, BriefSourceLead[]>;
  conversationsByCampaign: Record<string, ConversationTurn[]>;
}

export async function generateDailyPipelineBriefData(
  now = new Date()
): Promise<DailyPipelineBriefData> {
  const campaigns = parseIndexCampaigns(await readIndex()).filter((campaign) => campaign.sheet_id);
  const campaignPayloads = await Promise.all(
    campaigns.map(async (campaign) => {
      const [leadRows, turns] = await Promise.all([
        readChildQualifiedLeads(
          campaign.sheet_id,
          campaign.campaign_id,
          QUALIFIED_SHEET_RANGE_WITH_HEADER
        ).catch(() => []),
        getAllConversationTurns(campaign.sheet_id).catch(() => []),
      ]);
      return {
        campaign,
        leads: parseBriefSourceLeads(leadRows),
        turns,
      };
    })
  );

  return buildDailyPipelineBriefData({
    now,
    campaigns,
    leadsByCampaign: Object.fromEntries(
      campaignPayloads.map((payload) => [payload.campaign.campaign_id, payload.leads])
    ),
    conversationsByCampaign: Object.fromEntries(
      campaignPayloads.map((payload) => [payload.campaign.campaign_id, payload.turns])
    ),
  });
}

export function buildDailyPipelineBriefData(
  source: DailyPipelineBriefSource
): DailyPipelineBriefData {
  const now = source.now ?? new Date();
  const since = now.getTime() - 24 * 60 * 60 * 1000;
  const leadContexts = source.campaigns.flatMap((campaign) =>
    (source.leadsByCampaign[campaign.campaign_id] ?? []).map((lead) => {
      const turns = (source.conversationsByCampaign[campaign.campaign_id] ?? [])
        .filter((turn) => turn.lead_id === lead.lead_id)
        .sort((a, b) => toTime(a.sent_at) - toTime(b.sent_at));
      return { campaign, lead, turns };
    })
  );

  const newReplies = leadContexts
    .filter(({ lead, turns }) => {
      if (toTime(lead.reply_at) >= since) return true;
      return lastTurn(turns, "prospect") ? toTime(lastTurn(turns, "prospect")?.sent_at) >= since : false;
    })
    .map(({ campaign, lead, turns }) =>
      toBriefLead(campaign, lead, turns, "Réponse prospect reçue sur les dernières 24h", now)
    );

  const followupsDue = leadContexts
    .filter(({ lead, turns }) => {
      const status = lead.statut_email.toLowerCase();
      const last = lastTurn(turns);
      if (lead.setter_action.toLowerCase() === "escalated") return true;
      if (last?.role === "prospect") return true;
      return ["contacted", "relance_1", "relance_2", "opened", "clicked"].includes(status);
    })
    .map(({ campaign, lead, turns }) =>
      toBriefLead(campaign, lead, turns, "Action commerciale à reprendre ou relance à préparer", now)
    );

  const blockedOrStale = leadContexts
    .filter(({ campaign, lead, turns }) => {
      if (["generating", "paused"].includes(campaign.statut)) return true;
      if (lead.setter_action.toLowerCase().includes("blocked")) return true;
      const lastInteractionAt = Math.max(toTime(lead.reply_at), toTime(lastTurn(turns)?.sent_at));
      return lastInteractionAt > 0 && now.getTime() - lastInteractionAt >= 7 * 24 * 60 * 60 * 1000;
    })
    .map(({ campaign, lead, turns }) =>
      toBriefLead(campaign, lead, turns, "Lead bloqué, campagne pausée ou interaction ancienne", now)
    );

  const optionalDrafts = leadContexts
    .filter(({ lead, turns }) => {
      if (followupsDue.some((item) => item.id === lead.lead_id)) return false;
      const status = lead.statut_email.toLowerCase();
      return status === "new" || turns.length === 0;
    })
    .sort((a, b) => Number(b.lead.score || 0) - Number(a.lead.score || 0))
    .map(({ campaign, lead, turns }) =>
      toBriefLead(campaign, lead, turns, "Lead qualifié sans draft prioritaire", now)
    );

  const priorities = uniqueLeads([...newReplies, ...followupsDue, ...blockedOrStale])
    .sort(prioritySort)
    .slice(0, MAX_SECTION_LEADS);

  return {
    date: now.toISOString().slice(0, 10),
    summary: {
      active_campaigns: source.campaigns.filter((campaign) => campaign.statut === "active").length,
      qualified_leads: leadContexts.length,
      new_replies: newReplies.length,
      followups_due: followupsDue.length,
      blocked_or_stale: blockedOrStale.length,
      optional_drafts_to_prepare: optionalDrafts.length,
    },
    priorities,
    followups_due: uniqueLeads(followupsDue).slice(0, MAX_SECTION_LEADS),
    new_replies: uniqueLeads(newReplies).slice(0, MAX_SECTION_LEADS),
    blocked_or_stale: uniqueLeads(blockedOrStale).slice(0, MAX_SECTION_LEADS),
    market_signals: buildMarketSignals(leadContexts.map(({ campaign, lead }) => ({ campaign, lead }))),
    optional_drafts_to_prepare: uniqueLeads(optionalDrafts).slice(0, MAX_SECTION_LEADS),
  };
}

function parseBriefSourceLeads(rows: string[][]): BriefSourceLead[] {
  const data = rows.length > 0 && rows[0]?.[0] === "lead_id" ? rows.slice(1) : rows;
  return data
    .filter((row) => (row[0] ?? "").trim())
    .map((row) => ({
      lead_id: row[0] ?? "",
      campaign_id: row[1] ?? "",
      company: row[21] || row[2] || "",
      contact_name: [row[22] || row[9], row[23]].filter(Boolean).join(" ").trim(),
      score: row[5] ?? "0",
      score_reason: row[6] ?? "",
      statut_email: row[18] ?? "new",
      hiring_signals: row[14] ?? "",
      growth_stage: row[15] ?? "",
      buying_signal: row[16] ?? "",
      personalized_hook: row[17] ?? "",
      source_channel: row[28] ?? "",
      statut_li: row[29] ?? "",
      reply_intent: row[30] ?? "",
      reply_at: row[31] ?? "",
      setter_action: row[32] ?? "",
    }));
}

function toBriefLead(
  campaign: IndexCampaign,
  lead: BriefSourceLead,
  turns: ConversationTurn[],
  reason: string,
  now: Date
): FrankBriefLead {
  const last = lastTurn(turns);
  const lastProspect = lastTurn(turns, "prospect");
  const nextActionDue = nextActionFor(lead, last, now);
  return removeEmptyValues({
    id: lead.lead_id,
    company: lead.company || campaign.nom,
    contact_name: lead.contact_name || undefined,
    stage: stageFor(campaign, lead, last),
    temperature: temperatureFor(lead, lastProspect),
    reason: compactText(reason, 220),
    last_interaction: newestDate(lead.reply_at, last?.sent_at),
    next_action_due: nextActionDue,
    recommended_action: recommendedActionFor(campaign, lead, last),
    channel: channelFor(lead, turns),
    message_summary: messageSummaryFor(lead, lastProspect),
  });
}

function stageFor(
  campaign: IndexCampaign,
  lead: BriefSourceLead,
  last?: ConversationTurn
): FrankBriefLeadStage {
  if (["generating", "paused"].includes(campaign.statut)) return "blocked";
  if (lead.setter_action.toLowerCase().includes("blocked")) return "blocked";
  if (last?.role === "prospect" || lead.statut_email.toLowerCase() === "replied") return "replied";
  if (lead.reply_intent === "meeting_ready") return "meeting_ready";
  if (lead.statut_email.toLowerCase().startsWith("relance")) return "followup";
  if (lead.statut_email.toLowerCase() === "contacted") return "contacted";
  if (lead.statut_email.toLowerCase() === "new") return "new";
  return "unknown";
}

function temperatureFor(
  lead: BriefSourceLead,
  lastProspect?: ConversationTurn
): FrankBriefLead["temperature"] {
  if (lastProspect?.intent === "meeting_ready" || lead.reply_intent === "meeting_ready") return "hot";
  if (lastProspect?.intent === "interested" || lead.reply_intent === "interested") return "hot";
  const score = Number(lead.score || 0);
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  if (score > 0) return "cold";
  return "unknown";
}

function recommendedActionFor(
  campaign: IndexCampaign,
  lead: BriefSourceLead,
  last?: ConversationTurn
): string {
  if (["generating", "paused"].includes(campaign.statut)) return "Vérifier le blocage campagne avant action.";
  if (lead.setter_action.toLowerCase() === "escalated") return "Traiter manuellement la conversation escaladée.";
  if (last?.role === "prospect") return "Préparer une réponse contextualisée pour validation.";
  if (lead.statut_email.toLowerCase() === "new") return "Préparer un premier message sobre et personnalisé.";
  return "Préparer ou vérifier la prochaine relance.";
}

function nextActionFor(lead: BriefSourceLead, last: ConversationTurn | undefined, now: Date): string | null {
  if (lead.setter_action.toLowerCase() === "escalated" || last?.role === "prospect") {
    return now.toISOString().slice(0, 10);
  }
  return null;
}

function channelFor(
  lead: BriefSourceLead,
  turns: ConversationTurn[]
): FrankBriefLead["channel"] {
  const channels = new Set(turns.map((turn) => turn.channel));
  if (channels.size > 1) return "mixed";
  if (channels.has("linkedin")) return "linkedin";
  if (channels.has("email")) return "email";
  const source = lead.source_channel.toLowerCase();
  if (source.includes("linkedin")) return "linkedin";
  if (source.includes("email")) return "email";
  return "unknown";
}

function messageSummaryFor(lead: BriefSourceLead, lastProspect?: ConversationTurn): string | undefined {
  const parts = [
    lead.reply_intent && `Intent: ${lead.reply_intent}`,
    lead.buying_signal && `Signal: ${lead.buying_signal}`,
    lead.personalized_hook && `Hook: ${lead.personalized_hook}`,
    lastProspect?.content && `Dernier message: ${lastProspect.content}`,
  ].filter(Boolean);
  const value = compactText(parts.join(" | "), 360);
  return value || undefined;
}

function buildMarketSignals(
  contexts: Array<{ campaign: IndexCampaign; lead: BriefSourceLead }>
): string[] {
  const counts = new Map<string, number>();
  for (const { campaign, lead } of contexts) {
    for (const signal of [lead.buying_signal, lead.hiring_signals, lead.growth_stage]) {
      const clean = compactText(signal, 140);
      if (!clean) continue;
      const key = `${campaign.secteur || "Marché"}: ${clean}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([signal, count]) => (count > 1 ? `${signal} (${count})` : signal));
}

function prioritySort(a: FrankBriefLead, b: FrankBriefLead): number {
  const temperatureWeight = { hot: 3, warm: 2, cold: 1, unknown: 0 };
  return temperatureWeight[b.temperature] - temperatureWeight[a.temperature];
}

function uniqueLeads(leads: FrankBriefLead[]): FrankBriefLead[] {
  const seen = new Set<string>();
  return leads.filter((lead) => {
    if (seen.has(lead.id)) return false;
    seen.add(lead.id);
    return true;
  });
}

function lastTurn(turns: ConversationTurn[], role?: ConversationTurn["role"]): ConversationTurn | undefined {
  return [...turns].reverse().find((turn) => !role || turn.role === role);
}

function newestDate(...values: Array<string | undefined>): string | null {
  const newest = values.map(toTime).filter(Boolean).sort((a, b) => b - a)[0];
  return newest ? new Date(newest).toISOString() : null;
}

function toTime(value?: string): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compactText(value: string | undefined, maxLength: number): string {
  const clean = sanitizeText(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function sanitizeText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email_redacted]")
    .replace(/https?:\/\/\S+/gi, "[url_redacted]")
    .replace(/\b(?:bearer|token|api[_ -]?key|secret|password|cookie)\s*[:=]\s*\S+/gi, "[secret_redacted]")
    .replace(/\b(?:\+?\d[\d .()-]{7,}\d)\b/g, "[phone_redacted]");
}

function removeEmptyValues<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")
  ) as T;
}
