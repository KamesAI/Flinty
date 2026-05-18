import { NextResponse } from "next/server";
import {
  getCampaignEmailTemplates,
  readIndex,
  parseIndexCampaigns,
  readChildQualifiedLeads,
  parseLeadsV3,
  QUALIFIED_SHEET_RANGE_WITH_HEADER,
} from "@/lib/sheets";
import { readCampaignConfig } from "@/lib/replies";
import { buildWarmupState, configBool } from "@/lib/warmup";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaign_id } = await params;
  const wf3Webhook = process.env.N8N_WF3_WEBHOOK;

  if (!wf3Webhook) {
    return NextResponse.json({ success: false, message: "N8N_WF3_WEBHOOK non configuré" }, { status: 500 });
  }

  const indexRows = await readIndex();
  const campaign = parseIndexCampaigns(indexRows).find((c) => c.campaign_id === campaign_id);

  if (!campaign?.sheet_id) {
    return NextResponse.json({ success: false, message: "Campagne introuvable" }, { status: 404 });
  }

  const rows = await readChildQualifiedLeads(
    campaign.sheet_id,
    campaign_id,
    QUALIFIED_SHEET_RANGE_WITH_HEADER
  );
  const leads = parseLeadsV3(rows).filter(
    (l) => l.statut_email === "new"
  );
  const config = await readCampaignConfig(campaign.sheet_id, campaign_id);
  const warmup = buildWarmupState(config, 0);
  const leadsToSend = warmup.enabled ? leads.slice(0, warmup.maxDailySends) : leads;

  if (leadsToSend.length === 0) {
    return NextResponse.json({ success: false, message: "Aucun lead avec statut 'new' à contacter" });
  }

  const templates = await getCampaignEmailTemplates(campaign_id);

  const res = await fetch(wf3Webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id,
      leads_count: leadsToSend.length,
      warmup_campaign: configBool(config.warmup_campaign, false),
      warmup_day: warmup.day,
      warmup_max_daily_sends: warmup.maxDailySends,
      subject_prefix: warmup.enabled ? "[WARMUP] " : "",
      email_templates: templates,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ success: false, message: `n8n a répondu ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ success: true, leads_count: leadsToSend.length });
}
