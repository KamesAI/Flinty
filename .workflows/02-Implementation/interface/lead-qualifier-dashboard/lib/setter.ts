import Anthropic from "@anthropic-ai/sdk";
import { getAvailableSlots, formatSlotsNatural } from "./calendly";
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
  /\b(ia|i\.a\.|intelligence artificielle|bot|robot|chatgpt|gpt|claude|automated?)\b/i,
  /\b(vous êtes|t'es|es-tu|êtes-vous)\s+(un[e]?\s+)?(ia|bot|robot|machine|programme|logiciel)\b/i,
  /\b(parlez?|parlé)\s+(à|avec)\s+(un[e]?\s+)?(ia|bot|robot|humain|personne réelle)\b/i,
  /\b(qui\s+(répond|écrit|envoie)|c'est\s+qui)\b.*\b(ia|bot|machine|programme)\b/i,
];

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
  setter_tone: "formal" | "casual";
  setter_signature: string;
  icp_md: string;
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

// ——— Anthropic client (singleton) ———

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// ——— API calls ———

/**
 * Classifie l'intent du dernier message prospect.
 * Prompt caching sur le system prompt (invariant).
 */
export async function classifyIntent(
  thread: ConversationMessage[],
  campaignContext: string
): Promise<IntentResult> {
  const client = getClient();

  const lastProspectMsg = [...thread].reverse().find((m) => m.role === "prospect");
  const recentThread = thread
    .slice(-6)
    .map((m) => `[${m.role === "prospect" ? "Prospect" : "Setter"}] ${m.content}`)
    .join("\n\n");

  const userContent = `${campaignContext}\n\n## Thread récent\n${recentThread}\n\n## Dernier message prospect\n${lastProspectMsg?.content ?? ""}`;

  const response = await client.messages.create({
    model: process.env.SETTER_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 256,
    system: [
      {
        type: "text",
        text: buildIntentSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const raw = response.content.find((b) => b.type === "text")?.text ?? "";
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
  options?: { eventTypeUri?: string }
): Promise<{ draft: string; slots_proposed: boolean }> {
  const model =
    intent === "objection_trust"
      ? (process.env.SETTER_FALLBACK_MODEL ?? "claude-opus-4-6")
      : (process.env.SETTER_MODEL ?? "claude-sonnet-4-6");

  const client = getClient();
  const campaignCtx = buildConversationContext(ctx);
  const systemPrompt = buildSystemPrompt(ctx.campaign.setter_tone);

  const recentThread = thread
    .slice(-8)
    .map((m) => {
      const label = m.role === "prospect" ? "Prospect" : "Setter";
      return `[${label}] ${m.content}`;
    })
    .join("\n\n");

  const tools: Anthropic.Tool[] = [
    {
      name: "get_calendly_slots",
      description: "Récupère les 3 prochains créneaux Calendly disponibles pour proposer un RDV.",
      input_schema: {
        type: "object" as const,
        properties: {
          event_type_uri: {
            type: "string",
            description: "URI Calendly de l'event type",
          },
        },
        required: [],
      },
    },
  ];

  const userContent = `${campaignCtx}\n\n## Thread\n${recentThread}\n\n## Intent classifié\n${intent}\n\n## Signature\n${ctx.campaign.setter_signature}\n\nRédige la réponse maintenant.`;

  let draft = "";
  let slots_proposed = false;

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: campaignCtx,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools,
    tool_choice: intent === "meeting_ready" ? { type: "auto" } : { type: "none" },
    messages: [{ role: "user", content: userContent }],
  });

  // Handle tool use
  if (response.stop_reason === "tool_use") {
    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (toolUse && toolUse.type === "tool_use" && toolUse.name === "get_calendly_slots") {
      const eventUri =
        (toolUse.input as { event_type_uri?: string }).event_type_uri ??
        options?.eventTypeUri ??
        process.env.CALENDLY_EVENT_TYPE_URI ??
        "";

      let slotsText = "";
      try {
        const slots = await getAvailableSlots(eventUri, 3);
        slotsText = formatSlotsNatural(slots);
        slots_proposed = true;
      } catch {
        slotsText = "Consultez mon agenda directement : " + process.env.CALENDLY_EVENT_TYPE_URI;
      }

      // Continue conversation avec les slots
      const followUp = await client.messages.create({
        model,
        max_tokens: 512,
        system: [
          { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
          { type: "text", text: campaignCtx, cache_control: { type: "ephemeral" } },
        ],
        tools,
        messages: [
          { role: "user", content: userContent },
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUse.id,
                content: slotsText,
              },
            ],
          },
        ],
      });

      draft =
        followUp.content.find((b) => b.type === "text")?.text ?? "";
    }
  } else {
    draft = response.content.find((b) => b.type === "text")?.text ?? "";
  }

  return { draft: draft.trim(), slots_proposed };
}

/**
 * Pipeline complet Setter pour un lead.
 * Utilisé par WF7 (email) et WF11 (LinkedIn).
 */
export async function runSetterPipeline(
  thread: ConversationMessage[],
  ctx: SetterContext,
  options?: { forceValidation?: boolean; eventTypeUri?: string }
): Promise<SetterGenerateResult> {
  const campaignCtx = buildConversationContext(ctx);

  // Détecter question IA avant classification (EU AI Act art. 50)
  const lastMsg = [...thread].reverse().find((m) => m.role === "prospect");
  const aiDisclosure = lastMsg ? isAiQuestion(lastMsg.content) : false;

  // Classification intent
  const intentResult = await classifyIntent(thread, campaignCtx);
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

  return {
    draft,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    escalated: false,
    ai_disclosure: aiDisclosure,
    slots_proposed,
  };
}
