import {
  QUALIFIED_SHEET_RANGE_WITH_HEADER,
  parseIndexCampaigns,
  parseLeadsV3,
  readChildQualifiedLeads,
  readChildSheet,
  readIndex,
  updateConfigValue,
  updateLeadFieldInChild,
  type IndexCampaign,
  type Lead,
} from "@/lib/sheets";
import {
  addConversationTurnTag,
  appendConversationTurn,
  findConversationTurnById,
  generateTurnId,
  getAllConversationTurns,
  getConversationThread,
  listUnvalidatedSetterDrafts,
  validateConversationTurn,
  type ConversationTurn,
} from "@/lib/conversations";
import { runSetterPipeline, type ConversationMessage, type SetterCampaign, type SetterLead } from "@/lib/setter";

export interface ReplyLeadContext {
  campaign: IndexCampaign;
  lead: Lead;
  config: Record<string, string>;
}

export interface SetterDraftQueueItem {
  lead: Lead;
  campaign: IndexCampaign;
  draft: ConversationTurn;
  lastProspectTurn?: ConversationTurn;
  thread: ConversationTurn[];
}

export interface EscalatedSetterThreadItem {
  lead: Lead;
  campaign: IndexCampaign;
  escalatedTurn: ConversationTurn;
  lastProspectTurn?: ConversationTurn;
  thread: ConversationTurn[];
}

export interface EmailReplyInput {
  lead_id?: string;
  campaign_id?: string;
  from_email?: string;
  email?: string;
  content: string;
  sent_at?: string;
}

export interface EmailReplyResult {
  lead_id: string;
  campaign_id: string;
  prospect_turn_id: string;
  draft_turn_id?: string;
  intent: string;
  confidence: number;
  escalated: boolean;
  setter_validation: boolean;
  forced_validation?: boolean;
  forced_validation_reason?: "ai_question";
}

export function parseCampaignConfigRows(rows: string[][]): Record<string, string> {
  return rows.reduce<Record<string, string>>((config, row) => {
    const key = (row[0] ?? "").trim();
    if (key) config[key] = row[1] ?? "";
    return config;
  }, {});
}

export function leadToSetterLead(lead: Lead): SetterLead {
  return {
    lead_id: lead.lead_id,
    nom: lead.nom,
    prénom: lead.prénom,
    email: lead.email,
    poste: lead.poste,
    secteur: lead.secteur,
    ville: lead.ville,
    score: lead.score,
    site: lead.site,
    taille_equipe: lead.taille_equipe,
    has_ia_services: lead.has_ia_services,
  };
}

export function campaignToSetterCampaign(
  campaign: IndexCampaign,
  config: Record<string, string>
): SetterCampaign {
  return {
    campaign_id: campaign.campaign_id,
    nom: campaign.nom,
    offre_kames: config.offre_kames || campaign.offre_kames,
    secteur: config.secteur || campaign.secteur,
    localisation: campaign.localisation,
    workspace_id: campaign.workspace_id,
    setter_tone: config.setter_tone === "casual" ? "casual" : "formal",
    setter_signature: config.setter_signature || "Thomas Callendreau, Kames AI",
    icp_md: config.icp_md || "",
  };
}

export function conversationTurnsToMessages(turns: ConversationTurn[]): ConversationMessage[] {
  return turns.map((turn) => ({
    role: turn.role,
    content: turn.content,
    sent_at: turn.sent_at,
    channel: turn.channel,
  }));
}

export async function readCampaignConfig(
  sheetId: string,
  campaignId: string
): Promise<Record<string, string>> {
  const rows = await readChildSheet(sheetId, "Config!A2:B")
    .catch(() => readChildSheet(sheetId, `${campaignId}_Config!A2:B`))
    .catch(() => []);
  return parseCampaignConfigRows(rows);
}

async function readCampaigns(): Promise<IndexCampaign[]> {
  return parseIndexCampaigns(await readIndex());
}

async function readCampaignLeads(campaign: IndexCampaign): Promise<Lead[]> {
  if (!campaign.sheet_id) return [];
  const rows = await readChildQualifiedLeads(
    campaign.sheet_id,
    campaign.campaign_id,
    QUALIFIED_SHEET_RANGE_WITH_HEADER
  );
  return parseLeadsV3(rows);
}

export async function findLeadContextForReply(input: {
  lead_id?: string;
  campaign_id?: string;
  email?: string;
}): Promise<ReplyLeadContext | null> {
  const normalizedEmail = (input.email ?? "").trim().toLowerCase();
  const campaigns = (await readCampaigns()).filter(
    (campaign) => !input.campaign_id || campaign.campaign_id === input.campaign_id
  );

  for (const campaign of campaigns) {
    const leads = await readCampaignLeads(campaign);
    const lead = leads.find((candidate) => {
      if (input.lead_id && candidate.lead_id === input.lead_id) return true;
      return Boolean(normalizedEmail) && candidate.email.trim().toLowerCase() === normalizedEmail;
    });

    if (lead) {
      return {
        campaign,
        lead,
        config: await readCampaignConfig(campaign.sheet_id, campaign.campaign_id),
      };
    }
  }

  return null;
}

export async function processEmailReply(input: EmailReplyInput): Promise<EmailReplyResult> {
  const context = await findLeadContextForReply({
    lead_id: input.lead_id,
    campaign_id: input.campaign_id,
    email: input.from_email ?? input.email,
  });

  if (!context) {
    throw new Error("Lead introuvable pour cette réponse email");
  }

  const sentAt = input.sent_at || new Date().toISOString();
  const prospectTurn: ConversationTurn = {
    turn_id: generateTurnId(),
    lead_id: context.lead.lead_id,
    channel: "email",
    role: "prospect",
    content: input.content,
    sent_at: sentAt,
    intent: "",
    validated_by: "",
    edited_from_draft: "false",
  };

  const existingThread = await getConversationThread(context.campaign.sheet_id, context.lead.lead_id);
  const threadWithReply = [...existingThread, prospectTurn];

  await appendConversationTurn(context.campaign.sheet_id, prospectTurn);

  const setterResult = await runSetterPipeline(
    conversationTurnsToMessages(threadWithReply),
    {
      lead: leadToSetterLead(context.lead),
      campaign: campaignToSetterCampaign(context.campaign, context.config),
    },
    {
      eventTypeUri: context.config.calendly_event_uri,
      workspaceId: context.campaign.workspace_id,
    }
  );
  const forcedValidation = setterResult.ai_disclosure === true;

  const setterTurn: ConversationTurn = {
    turn_id: generateTurnId(),
    lead_id: context.lead.lead_id,
    channel: "email",
    role: "setter",
    content: setterResult.draft,
    sent_at: new Date().toISOString(),
    intent: setterResult.intent,
    validated_by: setterResult.escalated ? "escalated" : "",
    edited_from_draft: "false",
    tags: forcedValidation ? "forced_validation_ai_question" : "",
  };

  await appendConversationTurn(context.campaign.sheet_id, setterTurn);

  return {
    lead_id: context.lead.lead_id,
    campaign_id: context.campaign.campaign_id,
    prospect_turn_id: prospectTurn.turn_id,
    draft_turn_id: setterResult.escalated ? undefined : setterTurn.turn_id,
    intent: setterResult.intent,
    confidence: setterResult.confidence,
    escalated: setterResult.escalated,
    setter_validation: forcedValidation || context.config.setter_validation.toLowerCase() === "true",
    forced_validation: forcedValidation || undefined,
    forced_validation_reason: forcedValidation ? "ai_question" : undefined,
  };
}

export async function getReplyDetail(leadId: string): Promise<SetterDraftQueueItem | null> {
  const context = await findLeadContextForReply({ lead_id: leadId });
  if (!context) return null;

  const thread = await getConversationThread(context.campaign.sheet_id, leadId);
  const draft = [...listUnvalidatedSetterDrafts(thread)].pop();
  if (!draft) return null;

  return {
    lead: context.lead,
    campaign: context.campaign,
    draft,
    lastProspectTurn: [...thread].reverse().find((turn) => turn.role === "prospect"),
    thread,
  };
}

export async function listSetterDraftQueue(): Promise<SetterDraftQueueItem[]> {
  const campaigns = await readCampaigns();
  const items = await Promise.all(
    campaigns
      .filter((campaign) => campaign.sheet_id)
      .map(async (campaign) => {
        const [leads, turns] = await Promise.all([
          readCampaignLeads(campaign).catch(() => []),
          getAllConversationTurns(campaign.sheet_id).catch(() => []),
        ]);
        const drafts = listUnvalidatedSetterDrafts(turns);

        return drafts.flatMap((draft) => {
          const lead = leads.find((candidate) => candidate.lead_id === draft.lead_id);
          if (!lead) return [];
          const thread = turns.filter((turn) => turn.lead_id === draft.lead_id);
          return [{
            lead,
            campaign,
            draft,
            lastProspectTurn: [...thread].reverse().find((turn) => turn.role === "prospect"),
            thread,
          }];
        });
      })
  );

  return items.flat().sort(
    (a, b) => new Date(b.draft.sent_at).getTime() - new Date(a.draft.sent_at).getTime()
  );
}

export async function listEscalatedSetterThreads(): Promise<EscalatedSetterThreadItem[]> {
  const campaigns = await readCampaigns();
  const items = await Promise.all(
    campaigns
      .filter((campaign) => campaign.sheet_id)
      .map(async (campaign) => {
        const [leads, turns] = await Promise.all([
          readCampaignLeads(campaign).catch(() => []),
          getAllConversationTurns(campaign.sheet_id).catch(() => []),
        ]);
        const escalatedTurns = turns.filter(
          (turn) => turn.role === "setter" && turn.validated_by.startsWith("escalated")
        );

        return escalatedTurns.flatMap((escalatedTurn) => {
          const lead = leads.find((candidate) => candidate.lead_id === escalatedTurn.lead_id);
          if (!lead) return [];
          const thread = turns.filter((turn) => turn.lead_id === escalatedTurn.lead_id);
          return [{
            lead,
            campaign,
            escalatedTurn,
            lastProspectTurn: [...thread].reverse().find((turn) => turn.role === "prospect"),
            thread,
          }];
        });
      })
  );

  return items.flat().sort(
    (a, b) => new Date(b.escalatedTurn.sent_at).getTime() - new Date(a.escalatedTurn.sent_at).getTime()
  );
}

export async function triggerSetterSend(input: {
  lead_id: string;
  turn_id: string;
  validated_by: string;
  edited_content?: string;
}): Promise<void> {
  const context = await findLeadContextForReply({ lead_id: input.lead_id });
  if (!context) throw new Error("Lead introuvable");

  const draft = await findConversationTurnById(context.campaign.sheet_id, input.turn_id);
  if (!draft || draft.lead_id !== input.lead_id || draft.role !== "setter") {
    throw new Error("Draft Setter introuvable");
  }

  const webhook = process.env.N8N_WF8_WEBHOOK;
  if (!webhook) throw new Error("N8N_WF8_WEBHOOK non configuré");

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id: input.lead_id,
      turn_id: input.turn_id,
      sheet_id: context.campaign.sheet_id,
      campaign_id: context.campaign.campaign_id,
      validated_by: input.validated_by,
      edited_content: input.edited_content,
    }),
  });

  if (!response.ok) throw new Error(`WF8 a répondu ${response.status}`);
}

export async function escalateSetterDraft(input: {
  lead_id: string;
  turn_id: string;
  escalated_by: string;
  reason?: string;
}): Promise<void> {
  const context = await findLeadContextForReply({ lead_id: input.lead_id });
  if (!context) throw new Error("Lead introuvable");

  const label = input.reason
    ? `escalated:${input.escalated_by}:${input.reason}`
    : `escalated:${input.escalated_by}`;

  await Promise.all([
    validateConversationTurn(context.campaign.sheet_id, input.turn_id, label),
    updateLeadFieldInChild(
      context.campaign.sheet_id,
      context.campaign.campaign_id,
      input.lead_id,
      "setter_action",
      "escalated"
    ),
  ]);
}

export async function markWarmupPositiveReply(input: {
  lead_id: string;
  turn_id: string;
}): Promise<ConversationTurn> {
  const context = await findLeadContextForReply({ lead_id: input.lead_id });
  if (!context) throw new Error("Lead introuvable");

  const turn = await findConversationTurnById(context.campaign.sheet_id, input.turn_id);
  if (!turn || turn.lead_id !== input.lead_id || turn.role !== "prospect") {
    throw new Error("Reply prospect introuvable");
  }

  const updated = await addConversationTurnTag(
    context.campaign.sheet_id,
    input.turn_id,
    "warmup_positive_reply"
  );
  const allTurns = await getAllConversationTurns(context.campaign.sheet_id);
  const positiveReplies = allTurns.filter((candidate) => {
    const tags = candidate.turn_id === input.turn_id ? updated.tags : candidate.tags;
    return (tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .includes("warmup_positive_reply");
  }).length;

  await updateConfigValue(
    context.campaign.sheet_id,
    context.campaign.campaign_id,
    "warmup_positive_replies",
    String(positiveReplies)
  );

  return updated;
}
