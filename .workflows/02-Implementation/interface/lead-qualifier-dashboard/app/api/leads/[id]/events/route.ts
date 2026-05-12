import { NextResponse } from "next/server";
import { getLeadEmailEvents } from "@/lib/sheets";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const events = await getLeadEmailEvents(id);
  return NextResponse.json({ events });
}
