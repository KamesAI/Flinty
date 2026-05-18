import { NextResponse } from "next/server";
import { z } from "zod";
import { generateResponse } from "@/lib/setter";
import type { IntentLabel } from "@/lib/types";

const ConversationMessageSchema = z.object({
  role: z.enum(["prospect", "setter", "human"]),
  content: z.string(),
  sent_at: z.string(),
  channel: z.enum(["email", "linkedin"]),
});

const RequestSchema = z.object({
  thread: z.array(ConversationMessageSchema).min(1),
  intent: z.enum([
    "interested",
    "objection_price",
    "objection_timing",
    "objection_need",
    "objection_trust",
    "meeting_ready",
    "off_topic",
    "unsubscribe",
    "hostile",
  ]),
  campaign: z.object({
    campaign_id: z.string(),
    nom: z.string(),
    offre_kames: z.string(),
    secteur: z.string(),
    localisation: z.string(),
    setter_tone: z.enum(["formal", "casual"]).default("formal"),
    setter_signature: z.string().default(""),
    icp_md: z.string().default(""),
    workspace_id: z.string().default("kames-default"),
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
  event_type_uri: z.string().optional(),
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

  const { thread, intent, campaign, lead, event_type_uri } = parsed.data;
  const ctx = { lead, campaign };

  try {
    const result = await generateResponse(
      thread,
      ctx,
      intent as IntentLabel,
      {
        eventTypeUri: event_type_uri,
        workspaceId: campaign.workspace_id,
      }
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
