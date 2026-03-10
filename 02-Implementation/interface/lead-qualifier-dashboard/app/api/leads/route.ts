import { NextResponse } from "next/server";
import { getSheetData, parseLeads } from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaign_id = searchParams.get("campaign_id");

  const rows = await getSheetData("Leads_Qualified!A:P");
  let leads = parseLeads(rows);
  if (campaign_id) leads = leads.filter((l) => l.campaign_id === campaign_id);

  return NextResponse.json(leads);
}
