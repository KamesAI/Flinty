import { NextResponse } from "next/server";
import { z } from "zod";
import { parseIndexCampaigns, readIndex, updateLeadFieldInChild } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const OutreachEventSchema = z.object({
  campaign_id: z.string().trim().min(1),
  sheet_id: z.string().trim().optional(),
  lead_id: z.string().trim().min(1),
  statut_li: z.enum(["new", "invited", "accepted", "connected", "dm_sent", "replied", "failed"]),
  event: z.string().default(""),
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

  const parsed = OutreachEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const sheetId = await resolveSheetId(parsed.data.campaign_id, parsed.data.sheet_id);
  if (!sheetId) {
    return NextResponse.json({ error: "Campagne introuvable ou sheet_id manquant" }, { status: 404 });
  }

  await updateLeadFieldInChild(
    sheetId,
    parsed.data.campaign_id,
    parsed.data.lead_id,
    "statut_li",
    parsed.data.statut_li
  );

  return NextResponse.json({
    ok: true,
    lead_id: parsed.data.lead_id,
    statut_li: parsed.data.statut_li,
    event: parsed.data.event,
  });
}
