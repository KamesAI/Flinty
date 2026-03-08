import { NextResponse } from "next/server";

const WF2_WEBHOOK = process.env.N8N_WF2_WEBHOOK!;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaign_id } = await params;

  if (!WF2_WEBHOOK) {
    return NextResponse.json({ success: false, message: "N8N_WF2_WEBHOOK non configuré" }, { status: 500 });
  }

  const res = await fetch(WF2_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id }),
  });

  if (!res.ok) {
    return NextResponse.json({ success: false, message: `n8n a répondu ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
