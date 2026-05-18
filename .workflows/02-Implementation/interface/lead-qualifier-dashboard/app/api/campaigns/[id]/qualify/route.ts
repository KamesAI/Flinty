import { NextResponse } from "next/server";
import { readIndex, parseIndexCampaigns } from "@/lib/sheets";
import { readCampaignConfig } from "@/lib/replies";
import { buildWarmupState, configBool } from "@/lib/warmup";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaign_id } = await params;
  const wf2Webhook = process.env.N8N_WF2_WEBHOOK;

  if (!wf2Webhook) {
    return NextResponse.json({ success: false, message: "N8N_WF2_WEBHOOK non configuré" }, { status: 500 });
  }

  const indexRows = await readIndex();
  const campaign = parseIndexCampaigns(indexRows).find((c) => c.campaign_id === campaign_id);
  if (!campaign) {
    return NextResponse.json({ success: false, message: "Campagne introuvable" }, { status: 404 });
  }
  const config = campaign.sheet_id
    ? await readCampaignConfig(campaign.sheet_id, campaign_id)
    : {};
  const warmup = buildWarmupState(config, 0);

  const qualificationCallbackUrl = new URL(
    `/api/campaigns/${campaign_id}/qualification-complete`,
    req.url
  ).toString();

  const res = await fetch(wf2Webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id,
      sheet_id: campaign.sheet_id,
      warmup_campaign: configBool(config.warmup_campaign, false),
      bypass_scoring: warmup.enabled,
      forced_score: warmup.enabled ? 100 : undefined,
      qualification_callback_url: qualificationCallbackUrl,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ success: false, message: `n8n a répondu ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
