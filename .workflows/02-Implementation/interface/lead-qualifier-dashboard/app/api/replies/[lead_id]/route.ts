import { NextResponse } from "next/server";
import { getReplyDetail } from "@/lib/replies";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lead_id: string }> }
) {
  const { lead_id } = await params;
  const detail = await getReplyDetail(lead_id);

  if (!detail) {
    return NextResponse.json({ error: "Thread introuvable" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
