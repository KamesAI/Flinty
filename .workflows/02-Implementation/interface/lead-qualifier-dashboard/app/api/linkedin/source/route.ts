import { NextResponse } from "next/server";
import { z } from "zod";
import { getLatestLinkedInAccount } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const SourceSchema = z.object({
  campaign_id: z.string().trim().min(1),
  channel: z.enum(["linkedin_search", "post_engagers", "profile_visitors", "external_post"]),
  params: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = SourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const account = await getLatestLinkedInAccount();
  if (!account || account.status !== "connected") {
    return NextResponse.json({ error: "Compte LinkedIn non connecte" }, { status: 409 });
  }

  const webhook = process.env.N8N_WF9_WEBHOOK;
  if (!webhook) {
    return NextResponse.json({ error: "N8N_WF9_WEBHOOK non configure" }, { status: 503 });
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...parsed.data,
      account_id: account.account_id,
      requested_at: new Date().toISOString(),
      max_results: 100,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: `WF9 a repondu ${response.status}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true, status: "queued" });
}
