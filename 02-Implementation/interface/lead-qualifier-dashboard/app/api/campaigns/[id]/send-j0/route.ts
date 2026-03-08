import { NextResponse } from "next/server";
import { getCampaignEmailTemplates, getSheetData, parseLeads } from "@/lib/sheets";

const WF3_WEBHOOK = process.env.N8N_WF3_WEBHOOK!;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaign_id } = await params;

  if (!WF3_WEBHOOK) {
    return NextResponse.json({ success: false, message: "N8N_WF3_WEBHOOK non configuré" }, { status: 500 });
  }

  const rows = await getSheetData("Leads_Qualified!A:O");
  const leads = parseLeads(rows).filter(
    (l) => l.campaign_id === campaign_id && l.statut_email === "new"
  );

  if (leads.length === 0) {
    return NextResponse.json({ success: false, message: "Aucun lead avec statut 'new' à contacter" });
  }

  const templates = await getCampaignEmailTemplates(campaign_id);

  const res = await fetch(WF3_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id,
      leads_count: leads.length,
      email_templates: templates,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ success: false, message: `n8n a répondu ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ success: true, leads_count: leads.length });
}
