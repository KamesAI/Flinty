import { getAvailableSlots, formatSlotsNatural, getCalendlySchedulingUrl } from "./calendly";
import { CLAUDE_SONNET, getOpenRouter } from "./openrouter";
import { extractTokenUsage } from "./cost-monitoring";
import { appendCostTrackingUsage } from "./sheets";
import type { IntentLabel, IntentResult, CalendlySlot } from "./types";

// ——— Constants ———

const VALID_INTENTS: IntentLabel[] = [
  "interested",
  "objection_price",
  "objection_timing",
  "objection_need",
  "objection_trust",
  "meeting_ready",
  "off_topic",
  "unsubscribe",
  "hostile",
];

// Intents qui doivent déclencher une escalade humaine
const ESCALATE_INTENTS: IntentLabel[] = ["unsubscribe", "hostile", "off_topic"];

const CONFIDENCE_THRESHOLD = 0.7;

// AI question patterns (EU AI Act art. 50)
const AI_QUESTION_PATTERNS = [
  /(êtes-vous|es-tu|are you|vous êtes|t'es)\s+(un[e]?\s+|an?\s+)?(ia|i\.a\.|intelligence artificielle|ai|bot|robot|machine|programme|logiciel|humain|human)\b/i,
  /\b(vous êtes|t'es|es-tu|êtes-vous)\s+(un[e]?\s+)?(ia|bot|robot|machine|programme|logiciel)\b/i,
  /\b(parlez?|parlé)\s+(à|avec)\s+(un[e]?\s+)?(ia|bot|robot|humain|personne réelle)\b/i,
  /\b(qui\s+(répond|écrit|envoie)|c'est\s+qui)\b.*\b(ia|bot|machine|programme)\b/i,
  /\b(bot|robot)\s*\?/i,
  /\b(c['’]est|est-ce que c['’]est)\s+(automatique|un\s+bot|une\s+ia)\b/i,
  /\bautomatique\s*\?/i,
];

const AI_DISCLOSURE_MARKER = "assistant IA";

// ——— Types ———

export interface SetterLead {
  lead_id: string;
  nom: string;
  prénom: string;
  email: string;
  poste: string;
  secteur: string;
  ville: string;
  score: string;
  site: string;
  taille_equipe: string;
  has_ia_services: string;
}

export interface SetterCampaign {
  campaign_id: string;
  nom: string;
  offre_kames: string;
  secteur: string;
  localisation: string;
  workspace_id?: string;
  setter_tone: "formal" | "casual";
  setter_signature: string;
  icp_md: string;
  loom_video_url?: string;
}

export interface SetterContext {
  lead: SetterLead;
  campaign: SetterCampaign;
}

export interface ConversationMessage {
  role: "prospect" | "setter" | "human";
  content: string;
  sent_at: string;
  channel: "email" | "linkedin";
}

export type RouteAction = "generate" | "escalate";

export interface SetterGenerateResult {
  draft: string;
  intent: IntentLabel;
  confidence: number;
  escalated: boolean;
  ai_disclosure?: boolean;
  slots_proposed?: boolean;
}

export interface LoomContext {
  include: boolean;
  url: string;
  thumbnailUrl: string;
}

// ——— Pure helpers (testables sans API) ———

export function parseIntentResponse(raw: string): IntentResult {
  let text = raw.trim();

  // Strip markdown code blocks
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) text = codeMatch[1].trim();

  try {
    const parsed = JSON.parse(text);
    const intent = VALID_INTENTS.includes(parsed.intent) ? parsed.intent as IntentLabel : "off_topic";
    const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));
    return {
      intent,
      confidence,
      reasoning: String(parsed.reasoning ?? ""),
    };
  } catch {
    return { intent: "off_topic", confidence: 0, reasoning: "parse error" };
  }
}

export function shouldEscalate(intent: IntentLabel, confidence?: number): boolean {
  if (ESCALATE_INTENTS.includes(intent)) return true;
  if (confidence !== undefined && confidence < CONFIDENCE_THRESHOLD) return true;
  return false;
}

export function isAiQuestion(text: string): boolean {
  return AI_QUESTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function detectsAIQuestion(message: string): boolean {
  return isAiQuestion(message);
}

export function appendAIDisclosure(draft: string, signature: string): string {
  if (draft.includes(AI_DISCLOSURE_MARKER)) return draft;
  const validatedBy = signature.trim() || "Thomas";
  return `${draft.trim()}\n\n— Cette réponse a été préparée par un assistant IA et validée par ${validatedBy}.`;
}

export function routeIntent(intent: IntentLabel, confidence: number): RouteAction {
  if (shouldEscalate(intent, confidence)) return "escalate";
  return "generate";
}

export function buildConversationContext(ctx: SetterContext): string {
  const { lead, campaign } = ctx;
  return `
## Contexte campagne
- **Campagne** : ${campaign.nom}
- **Offre** : ${campaign.offre_kames}
- **Secteur ciblé** : ${campaign.secteur} — ${campaign.localisation}

## ICP
${campaign.icp_md}

## Lead
- **Nom** : ${lead.prénom} ${lead.nom}
- **Poste** : ${lead.poste}
- **Secteur** : ${lead.secteur}
- **Ville** : ${lead.ville}
- **Site** : ${lead.site}
- **Taille équipe** : ${lead.taille_equipe}
- **Score** : ${lead.score}/100
`.trim();
}

export function extractLoomId(loomUrl: string): string {
  try {
    const url = new URL(loomUrl);
    const shareMatch = url.pathname.match(/\/share\/([^/?#]+)/);
    if (shareMatch?.[1]) return shareMatch[1];
    const embedMatch = url.pathname.match(/\/embed\/([^/?#]+)/);
    return embedMatch?.[1] ?? "";
  } catch {
    return "";
  }
}

export function getLoomThumbnailUrl(loomUrl: string): string {
  const loomId = extractLoomId(loomUrl);
  return loomId ? `https://www.loom.com/thumbnails/${loomId}.jpg` : "";
}

export function shouldIncludeLoom(
  loomVideoUrl: string | undefined,
  intent: IntentLabel | string,
  followUpCount = 0
): boolean {
  if (!loomVideoUrl?.trim()) return false;
  return followUpCount >= 4 || ["interested", "demande_info", "interested_wants_more"].includes(intent);
}

export function buildLoomContext(
  loomVideoUrl: string | undefined,
  intent: IntentLabel | string,
  followUpCount = 0
): LoomContext {
  if (!shouldIncludeLoom(loomVideoUrl, intent, followUpCount)) {
    return { include: false, url: "", thumbnailUrl: "" };
  }
  const url = loomVideoUrl!.trim();
  return { include: true, url, thumbnailUrl: getLoomThumbnailUrl(url) };
}

export function appendLoomToDraft(draft: string, channel: "email" | "linkedin", loom: LoomContext): string {
  if (!loom.include || !loom.url || draft.includes(loom.url)) return draft;
  if (channel === "linkedin") {
    return `${draft.trim()}\n\nJ'ai aussi enregistré une courte vidéo de 2 min : ${loom.url}`;
  }
  const thumbnail = loom.thumbnailUrl || loom.url;
  return `${draft.trim()}

<p>Regardez cette vidéo de 2 min :</p>
<a href="${loom.url}" target="_blank" rel="noopener noreferrer">
  <img src="${thumbnail}" width="480" alt="Vidéo 2 min - Thomas" style="border-radius:8px;border:1px solid #eee;max-width:100%;height:auto"/>
</a>
<p><a href="${loom.url}" target="_blank" rel="noopener noreferrer">${loom.url}</a></p>`;
}

export function buildSystemPrompt(tone: "formal" | "casual"): string {
  const toneInstruction =
    tone === "formal"
      ? "Ton professionnel et direct. Vouvoiement."
      : "Ton décontracté et authentique. Tutoiement si le prospect tutoie.";

  return `Tu es un AI Setter expert en négociation commerciale. Ton rôle : répondre aux emails/DMs de prospects.

## Technique Voss (mirroring)
Commence par reformuler (miroir) 1 à 3 mots-clés du dernier message du prospect. Exemple : prospect dit "pas le bon moment" → tu commences par "Pas le bon moment..."

## No-Oriented Questions
Si objection : pose UNE seule question orientée "non" (Chris Voss). Ex : "Est-ce que c'est définitivement hors de question pour vous ?"

## Contraintes absolues
- Maximum 120 mots par réponse
- Jamais de templates ou phrases génériques
- Ton miroir prospect (adapte-toi à son registre)
- ${toneInstruction}
- Si intent=meeting_ready : propose les créneaux de façon naturelle, intégrée dans le message
- Jamais de questions multiples dans un même message

## Format de réponse
Retourne UNIQUEMENT le texte du message, sans introduction ni explication.`.trim();
}

function buildIntentSystemPrompt(): string {
  return `Tu es un classificateur d'intent pour emails/DMs commerciaux. Analyse le dernier message du prospect.

Retourne UNIQUEMENT un JSON valide :
{"intent": "<intent>", "confidence": <0.0-1.0>, "reasoning": "<1 phrase>"}

Valeurs d'intent autorisées :
- interested : prospect curieux, veut plus d'infos
- objection_price : bloque sur le prix/budget
- objection_timing : pas le bon moment
- objection_need : ne voit pas le besoin
- objection_trust : doute sur la crédibilité/résultats
- meeting_ready : veut booker un appel/RDV
- off_topic : message hors sujet
- unsubscribe : veut se désabonner / "pas intéressé définitivement"
- hostile : agressif, insultant

RÉPONDS UNIQUEMENT LE JSON`.trim();
}

// ——— API calls ———

async function trackSetterUsage(campaignId: string | undefined, response: unknown, calendlyCalls = 0) {
  if (!campaignId) return;
  const usage = extractTokenUsage(response);
  if (usage.totalTokens <= 0) return;

  try {
    await appendCostTrackingUsage({
      campaignId,
      usage,
      calendlyCalls,
    });
  } catch (error) {
    console.warn(
      "[setter] Cost_Tracking append failed:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Classifie l'intent du dernier message prospect.
 * Prompt caching sur le system prompt (invariant).
 */
export async function classifyIntent(
  thread: ConversationMessage[],
  campaignContext: string,
  options?: { campaignId?: string }
): Promise<IntentResult> {
  const client = getOpenRouter();

  const lastProspectMsg = [...thread].reverse().find((m) => m.role === "prospect");
  const recentThread = thread
    .slice(-6)
    .map((m) => `[${m.role === "prospect" ? "Prospect" : "Setter"}] ${m.content}`)
    .join("\n\n");

  const userContent = `${campaignContext}\n\n## Thread récent\n${recentThread}\n\n## Dernier message prospect\n${lastProspectMsg?.content ?? ""}`;

  const response = await client.chat.completions.create({
    model: process.env.SETTER_MODEL ?? CLAUDE_SONNET,
    max_tokens: 256,
    messages: [
      { role: "system", content: buildIntentSystemPrompt() },
      { role: "user", content: userContent },
    ],
  });
  await trackSetterUsage(options?.campaignId, response);

  const raw = response.choices[0]?.message?.content ?? "";
  return parseIntentResponse(raw);
}

/**
 * Génère un draft de réponse Setter.
 * Avec tool call get_calendly_slots si intent=meeting_ready.
 * Prompt caching sur system prompt + contexte campagne.
 */
export async function generateResponse(
  thread: ConversationMessage[],
  ctx: SetterContext,
  intent: IntentLabel,
  options?: { eventTypeUri?: string; workspaceId?: string; followUpCount?: number; channel?: "email" | "linkedin" }
): Promise<{ draft: string; slots_proposed: boolean }> {
  const model =
    intent === "objection_trust"
      ? (process.env.SETTER_FALLBACK_MODEL ?? process.env.SETTER_MODEL ?? CLAUDE_SONNET)
      : (process.env.SETTER_MODEL ?? CLAUDE_SONNET);

  const client = getOpenRouter();
  const campaignCtx = buildConversationContext(ctx);
  const systemPrompt = buildSystemPrompt(ctx.campaign.setter_tone);
  const channel = options?.channel ?? thread.at(-1)?.channel ?? "email";
  const loom = buildLoomContext(ctx.campaign.loom_video_url, intent, options?.followUpCount ?? 0);

  const recentThread = thread
    .slice(-8)
    .map((m) => {
      const label = m.role === "prospect" ? "Prospect" : "Setter";
      return `[${label}] ${m.content}`;
    })
    .join("\n\n");

  const tools = [
    {
      type: "function" as const,
      function: {
        name: "get_calendly_slots",
        description: "Récupère les 3 prochains créneaux Calendly disponibles pour proposer un RDV.",
        parameters: {
          type: "object",
          properties: {
            event_type_uri: {
              type: "string",
              description: "URI Calendly de l'event type",
            },
          },
          required: [],
        },
      },
    },
  ];

  const loomInstruction = loom.include
    ? channel === "linkedin"
      ? `\n\n## Loom\nInclure ce lien Loom en texte simple dans la réponse : ${loom.url}`
      : `\n\n## Loom\nPrévoir une transition naturelle vers une vidéo Loom de 2 min. Le bloc HTML cliquable sera ajouté automatiquement.`
    : "";
  const userContent = `${campaignCtx}\n\n## Thread\n${recentThread}\n\n## Intent classifié\n${intent}\n\n## Signature\n${ctx.campaign.setter_signature}${loomInstruction}\n\nRédige la réponse maintenant.`;

  let draft = "";
  let slots_proposed = false;

  const response = await client.chat.completions.create({
    model,
    max_tokens: 512,
    tools,
    tool_choice: intent === "meeting_ready" ? "auto" : "none",
    messages: [
      { role: "system", content: `${systemPrompt}\n\n${campaignCtx}` },
      { role: "user", content: userContent },
    ],
  });
  await trackSetterUsage(ctx.campaign.campaign_id, response);

  // Handle tool use
  const assistantMessage = response.choices[0]?.message;
  const toolCall = assistantMessage?.tool_calls?.find(
    (call) => call.type === "function" && call.function.name === "get_calendly_slots"
  );
  if (toolCall) {
    try {
      const functionCall = toolCall as { id: string; function: { arguments?: string } };
      const input = functionCall.function.arguments
        ? JSON.parse(functionCall.function.arguments)
        : {};
      const eventUri =
        (input as { event_type_uri?: string }).event_type_uri ??
        options?.eventTypeUri ??
        process.env.CALENDLY_EVENT_TYPE_URI ??
        "";

      let slotsText = "";
      try {
        const slots = await getAvailableSlots(
          eventUri,
          3,
          options?.workspaceId ?? ctx.campaign.workspace_id
        );
        slotsText = formatSlotsNatural(slots);
        slots_proposed = true;
      } catch {
        const schedulingUrl = await getCalendlySchedulingUrl(eventUri);
        slotsText = schedulingUrl
          ? "Consultez mon agenda directement : " + schedulingUrl
          : "Je vous envoie mon lien de réservation juste après.";
      }

      // Continue conversation avec les slots
      const followUp = await client.chat.completions.create({
        model,
        max_tokens: 512,
        tools,
        messages: [
          { role: "system", content: `${systemPrompt}\n\n${campaignCtx}` },
          { role: "user", content: userContent },
          assistantMessage,
          {
            role: "tool",
            tool_call_id: functionCall.id,
            content: slotsText,
          },
        ],
      });
      await trackSetterUsage(ctx.campaign.campaign_id, followUp, slots_proposed ? 1 : 0);

      draft = followUp.choices[0]?.message?.content ?? "";
    } catch {
      draft = assistantMessage?.content ?? "";
    }
  } else {
    draft = assistantMessage?.content ?? "";
  }

  return { draft: appendLoomToDraft(draft.trim(), channel, loom), slots_proposed };
}

/**
 * Pipeline complet Setter pour un lead.
 * Utilisé par WF7 (email) et WF11 (LinkedIn).
 */
export async function runSetterPipeline(
  thread: ConversationMessage[],
  ctx: SetterContext,
  options?: { forceValidation?: boolean; eventTypeUri?: string; workspaceId?: string }
): Promise<SetterGenerateResult> {
  const campaignCtx = buildConversationContext(ctx);

  // Détecter question IA avant classification (EU AI Act art. 50)
  const lastMsg = [...thread].reverse().find((m) => m.role === "prospect");
  const aiDisclosure = lastMsg ? isAiQuestion(lastMsg.content) : false;

  // Classification intent
  const intentResult = await classifyIntent(thread, campaignCtx, {
    campaignId: ctx.campaign.campaign_id,
  });
  const action = routeIntent(intentResult.intent, intentResult.confidence);

  if (action === "escalate") {
    return {
      draft: "",
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      escalated: true,
      ai_disclosure: aiDisclosure,
    };
  }

  // Génération réponse
  const { draft, slots_proposed } = await generateResponse(
    thread,
    ctx,
    intentResult.intent,
    options
  );
  const finalDraft = aiDisclosure
    ? appendAIDisclosure(draft, ctx.campaign.setter_signature)
    : draft;

  return {
    draft: finalDraft,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    escalated: false,
    ai_disclosure: aiDisclosure,
    slots_proposed,
  };
}
