import { NextResponse } from "next/server";
import { graduateCampaign } from "@/lib/setter-graduation";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const campaignId = new URL(request.url).searchParams.get("campaign_id");
  if (!campaignId) {
    return NextResponse.json({ error: "campaign_id requis" }, { status: 422 });
  }

  try {
    const result = await graduateCampaign(campaignId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
