import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendConversationTurn,
  generateTurnId,
} from "@/lib/conversations";
import { parseIndexCampaigns, readIndex } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const SetterLITurnsSchema = z.object({
  campaign_id: z.string().trim().min(1),
  sheet_id: z.string().trim().optional(),
  lead_id: z.string().trim().min(1),
  prospect_text: z.string().default(""),
  setter_text: z.string().default(""),
  intent: z.string().default(""),
  sent_at: z.string().default(() => new Date().toISOString()),
});

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function resolveSheetId(campaignId: string, explicitSheetId?: string) {
  if (explicitSheetId) return explicitSheetId;
  const campaign = parseIndexCampaigns(await readIndex()).find(
    (candidate) => candidate.campaign_id === campaignId
  );
  return campaign?.sheet_id ?? "";
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = SetterLITurnsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const sheetId = await resolveSheetId(parsed.data.campaign_id, parsed.data.sheet_id);
  if (!sheetId) {
    return NextResponse.json({ error: "Campagne introuvable ou sheet_id manquant" }, { status: 404 });
  }

  let turnsAppended = 0;
  if (parsed.data.prospect_text.trim()) {
    await appendConversationTurn(sheetId, {
      turn_id: generateTurnId(),
      lead_id: parsed.data.lead_id,
      channel: "linkedin",
      role: "prospect",
      content: parsed.data.prospect_text,
      sent_at: parsed.data.sent_at,
      intent: "",
      validated_by: "",
      edited_from_draft: "false",
      tags: "linkedin",
      human_intent_label: "",
    });
    turnsAppended += 1;
  }

  if (parsed.data.setter_text.trim()) {
    await appendConversationTurn(sheetId, {
      turn_id: generateTurnId(),
      lead_id: parsed.data.lead_id,
      channel: "linkedin",
      role: "setter",
      content: parsed.data.setter_text,
      sent_at: parsed.data.sent_at,
      intent: parsed.data.intent as never,
      validated_by: "",
      edited_from_draft: "false",
      tags: "setter_draft,linkedin",
      human_intent_label: "",
    });
    turnsAppended += 1;
  }

  return NextResponse.json({
    ok: true,
    lead_id: parsed.data.lead_id,
    turns_appended: turnsAppended,
  });
}
