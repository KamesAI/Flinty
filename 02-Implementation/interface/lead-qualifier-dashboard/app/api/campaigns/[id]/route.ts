import { NextResponse } from "next/server";
import { getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campRows, leadRows] = await Promise.all([
    getSheetData("Campagnes!A:L"),
    getSheetData("Leads_Qualified!A:O"),
  ]);
  const campaign = parseCampaigns(campRows).find((c) => c.campaign_id === id);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leads = parseLeads(leadRows).filter((l) => l.campaign_id === id);
  return NextResponse.json({ campaign, leads });
}
