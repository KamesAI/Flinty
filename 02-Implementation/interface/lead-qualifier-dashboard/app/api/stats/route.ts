import { NextResponse } from "next/server";
import { getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";

export async function GET() {
  const [campRows, leadRows] = await Promise.all([
    getSheetData("Campagnes!A:L"),
    getSheetData("Leads_Qualified!A:O"),
  ]);
  const campaigns = parseCampaigns(campRows);
  const leads = parseLeads(leadRows);

  const stats = {
    total_campaigns: campaigns.length,
    total_leads_qualified: leads.length,
    total_emails: campaigns.reduce((s, c) => s + parseInt(c.emails_envoyés || "0"), 0),
    avg_open_rate: campaigns.length
      ? Math.round(campaigns.reduce((s, c) => s + parseFloat(c.taux_ouverture || "0"), 0) / campaigns.length)
      : 0,
    replied: leads.filter((l) => l.statut_email === "replied").length,
    bounced: leads.filter((l) => l.statut_email === "bounced").length,
  };
  return NextResponse.json(stats);
}
