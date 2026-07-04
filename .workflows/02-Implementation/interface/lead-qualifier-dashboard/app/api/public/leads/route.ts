import { NextResponse } from "next/server";

import { appendToChildSheet, parseIndexCampaigns, readIndex } from "@/lib/sheets";
import { filterCampaignsByWorkspace } from "@/lib/public-api";
import { resolveWorkspaceIdFromRequest, unauthorizedResponse } from "@/lib/public-api-server";

export const dynamic = "force-dynamic";

interface PublicLeadBody {
  campaign_id?: string;
  lead?: {
    nom?: string;
    site?: string;
    ville?: string;
    téléphone?: string;
  };
}

export async function POST(request: Request) {
  const workspaceId = await resolveWorkspaceIdFromRequest(request);
  if (!workspaceId) return unauthorizedResponse();

  const body = (await request.json().catch(() => ({}))) as PublicLeadBody;
  const nom = (body.lead?.nom ?? "").trim();
  if (!body.campaign_id || !nom) {
    return NextResponse.json(
      { success: false, message: "campaign_id et lead.nom sont requis" },
      { status: 400 }
    );
  }

  const campaigns = filterCampaignsByWorkspace(
    parseIndexCampaigns(await readIndex()),
    workspaceId
  );
  const campaign = campaigns.find((c) => c.campaign_id === body.campaign_id);
  if (!campaign || !campaign.sheet_id) {
    return NextResponse.json(
      { success: false, message: "Campagne introuvable pour ce workspace" },
      { status: 404 }
    );
  }

  const leadId = `api_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await appendToChildSheet(campaign.sheet_id, "Leads_Raw!A:J", [
    leadId,
    campaign.campaign_id,
    nom,
    (body.lead?.site ?? "").trim(),
    (body.lead?.ville ?? "").trim(),
    (body.lead?.téléphone ?? "").trim(),
    "",
    "",
    "",
    new Date().toISOString(),
  ]);

  return NextResponse.json({ success: true, lead_id: leadId }, { status: 201 });
}
