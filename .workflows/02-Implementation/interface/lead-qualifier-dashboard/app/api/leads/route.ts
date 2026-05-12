import { NextResponse } from "next/server";
import { readIndex, parseIndexCampaigns, getAllLeadsV3 } from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaign_id = searchParams.get("campaign_id");

  const indexRows = await readIndex();
  const indexCampaigns = parseIndexCampaigns(indexRows);
  let leads = await getAllLeadsV3(indexCampaigns);
  if (campaign_id) leads = leads.filter((l) => l.campaign_id === campaign_id);

  return NextResponse.json(leads);
}
