import { NextResponse } from "next/server";
import { getPublicOrigin } from "@/lib/request-origin";
import { readIndex, parseIndexCampaigns, readChildSheet, updateIndex } from "@/lib/sheets";
import { configBool } from "@/lib/warmup";
import {
  DEFAULT_ESTIMATED_QUALIFICATION_RATE,
  DEFAULT_TARGET_QUALIFIED_LEADS,
  DEFAULT_TARGET_TOLERANCE_PERCENT,
  estimateTargetRawLeads,
} from "@/lib/lead-targets";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaign_id } = await params;
  const wf1Webhook = process.env.N8N_WF1_WEBHOOK;
  const generationCallbackUrl = new URL(
    `/api/campaigns/${campaign_id}/generation-complete`,
    getPublicOrigin(_req)
  ).toString();

  if (!wf1Webhook) {
    return NextResponse.json({ success: false, message: "N8N_WF1_WEBHOOK non configuré" }, { status: 500 });
  }

  const indexRows = await readIndex();
  const campaign = parseIndexCampaigns(indexRows).find((c) => c.campaign_id === campaign_id);
  if (!campaign) {
    return NextResponse.json({ success: false, message: "Campagne introuvable" }, { status: 404 });
  }

  // Lire l'onglet Config pour récupérer icp_md, villes, etc.
  const configRows = campaign.sheet_id
    ? await readChildSheet(campaign.sheet_id, `${campaign_id}_Config!A2:B`)
    : [];

  const config: Record<string, string> = {};
  for (const [key, value] of configRows) {
    if (key) config[key] = value ?? "";
  }

  const targetQualifiedLeads = parsePositiveInt(
    config.target_qualified_leads,
    DEFAULT_TARGET_QUALIFIED_LEADS
  );
  const estimatedQualificationRate = parsePositiveFloat(
    config.estimated_qualification_rate,
    DEFAULT_ESTIMATED_QUALIFICATION_RATE
  );
  const targetRawLeads = parsePositiveInt(
    config.target_raw_leads,
    estimateTargetRawLeads(targetQualifiedLeads, estimatedQualificationRate)
  );
  const targetTolerancePercent = parsePositiveInt(
    config.target_tolerance_percent,
    DEFAULT_TARGET_TOLERANCE_PERCENT
  );

  await updateIndex(campaign_id, { statut: "generating" });

  const res = await fetch(wf1Webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id,
      spreadsheet_id: campaign.sheet_id,
      tab_raw: `${campaign_id}_Raw`,
      secteur: campaign.secteur,
      localisation: campaign.localisation,
      offre_kames: campaign.offre_kames,
      villes: config.villes ?? "",
      taille_equipe: config.taille_equipe ?? "",
      poste_cible: config.poste_cible ?? "",
      template_email: config.template_email ?? "j0_default",
      icp_md: config.icp_md ?? "",
      target_qualified_leads: targetQualifiedLeads,
      target_raw_leads: targetRawLeads,
      target_tolerance_percent: targetTolerancePercent,
      estimated_qualification_rate: estimatedQualificationRate,
      search_terms: config.search_terms ?? campaign.secteur,
      search_locations: config.search_locations ?? config.villes ?? campaign.localisation,
      warmup_campaign: configBool(config.warmup_campaign, false),
      generation_callback_url: generationCallbackUrl,
    }),
  });

  if (!res.ok) {
    await updateIndex(campaign_id, { statut: "paused" });
    return NextResponse.json({ success: false, message: `n8n a répondu ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveFloat(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
