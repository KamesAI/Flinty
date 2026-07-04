import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendLinkedInHealthHistory,
  getLatestLinkedInHealth,
  upsertLinkedInHealth,
} from "@/lib/sheets";

export const dynamic = "force-dynamic";

const LinkedInHealthSchema = z.object({
  account_id: z.string().trim().min(1),
  status: z.enum(["active", "paused_captcha", "paused_warning", "paused_low_accept", "paused_follow_mode"]),
  reason: z.string().default(""),
  pause_started_at: z.string().default(""),
  last_check_at: z.string().default(() => new Date().toISOString()),
  acceptance_rate_7d: z.string().default("0"),
  invites_sent_7d: z.string().default("0"),
  invites_accepted_7d: z.string().default("0"),
  invites_sent_today: z.string().default("0"),
  invites_sent_week: z.string().default("0"),
  organic_action: z.string().default(""),
});

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  try {
    const accountId = new URL(req.url).searchParams.get("account_id")?.trim() || undefined;
    const health = await getLatestLinkedInHealth(accountId);
    if (!health) {
      return NextResponse.json({
        account_id: accountId ?? "",
        status: "active",
        reason: "",
        pause_started_at: "",
        last_check_at: "",
      });
    }

    return NextResponse.json(health);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = LinkedInHealthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const row = {
    account_id: parsed.data.account_id,
    status: parsed.data.status,
    reason: parsed.data.reason,
    pause_started_at: parsed.data.pause_started_at,
    last_check_at: parsed.data.last_check_at,
    acceptance_rate_7d: parsed.data.acceptance_rate_7d,
    invites_sent_today: parsed.data.invites_sent_today,
    invites_sent_week: parsed.data.invites_sent_week,
    organic_action: parsed.data.organic_action,
  };

  try {
    await upsertLinkedInHealth(row);
    await appendLinkedInHealthHistory({
      ...row,
      invites_sent_7d: parsed.data.invites_sent_7d,
      invites_accepted_7d: parsed.data.invites_accepted_7d,
    });
    return NextResponse.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
