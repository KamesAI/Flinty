import { NextResponse } from "next/server";
import { getSheetData, parseLeads } from "@/lib/sheets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await getSheetData("Leads_Qualified!A:P");
  const lead = parseLeads(rows).find((l) => l.lead_id === id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}
