import { NextResponse } from "next/server";
import { readIndex, parseIndexCampaigns, getAllLeadsV3 } from "@/lib/sheets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const indexRows = await readIndex();
  const indexCampaigns = parseIndexCampaigns(indexRows);
  const leads = await getAllLeadsV3(indexCampaigns);
  const lead = leads.find((l) => l.lead_id === id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}
