import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyIntent, buildConversationContext, isAiQuestion, routeIntent } from "@/lib/setter";

const ConversationMessageSchema = z.object({
  role: z.enum(["prospect", "setter", "human"]),
  content: z.string(),
  sent_at: z.string(),
  channel: z.enum(["email", "linkedin"]),
});

const RequestSchema = z.object({
  thread: z.array(ConversationMessageSchema).min(1),
  campaign: z.object({
    campaign_id: z.string(),
    nom: z.string(),
    offre_kames: z.string(),
    secteur: z.string(),
    localisation: z.string(),
    setter_tone: z.enum(["formal", "casual"]).default("formal"),
    setter_signature: z.string().default(""),
    icp_md: z.string().default(""),
  }),
  lead: z.object({
    lead_id: z.string(),
    nom: z.string(),
    prénom: z.string().default(""),
    email: z.string(),
    poste: z.string().default(""),
    secteur: z.string().default(""),
    ville: z.string().default(""),
    score: z.string().default("0"),
    site: z.string().default(""),
    taille_equipe: z.string().default(""),
    has_ia_services: z.string().default("false"),
  }),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { thread, campaign, lead } = parsed.data;
  const ctx = { lead, campaign };
  const campaignCtx = buildConversationContext(ctx);

  // EU AI Act art. 50 — détecter question IA avant classification
  const lastProspectMsg = [...thread].reverse().find((m) => m.role === "prospect");
  const ai_disclosure = lastProspectMsg ? isAiQuestion(lastProspectMsg.content) : false;

  try {
    const intentResult = await classifyIntent(thread, campaignCtx);
    const action = routeIntent(intentResult.intent, intentResult.confidence);

    return NextResponse.json({
      ...intentResult,
      action,
      ai_disclosure,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
