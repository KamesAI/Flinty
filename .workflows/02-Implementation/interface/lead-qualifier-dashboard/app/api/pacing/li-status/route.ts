import { NextResponse } from "next/server";
import { getLIRampUpCap, LI_CAP_WEEKLY } from "@/lib/pacing";
import { getLatestLinkedInHealth } from "@/lib/sheets";

export const dynamic = "force-dynamic";

function parseCount(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseWeekIndex(url: URL): number {
  const parsed = Number.parseInt(url.searchParams.get("week_index") ?? "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accountId = url.searchParams.get("account_id")?.trim() || undefined;
    const weekIndex = parseWeekIndex(url);
    const dailyCap = getLIRampUpCap(weekIndex);

    const health = await getLatestLinkedInHealth(accountId);
    if (!health) {
      return NextResponse.json({
        account_id: accountId ?? "",
        allowed: false,
        reason: "li_health_not_found",
        remaining_today: 0,
        remaining_week: 0,
        sent_today: 0,
        sent_week: 0,
        caps_li: {
          daily_invitations: dailyCap,
          weekly_invitations: LI_CAP_WEEKLY,
        },
      });
    }

    const sentToday = parseCount(health.invites_sent_today);
    const sentWeek = parseCount(health.invites_sent_week);
    const remainingToday = Math.max(0, dailyCap - sentToday);
    const remainingWeek = Math.max(0, LI_CAP_WEEKLY - sentWeek);

    let allowed = true;
    let reason = "";
    if (health.status !== "active") {
      allowed = false;
      reason = health.status;
    } else if (remainingWeek <= 0) {
      allowed = false;
      reason = "cap_weekly_li";
    } else if (remainingToday <= 0) {
      allowed = false;
      reason = "cap_daily_li";
    }

    return NextResponse.json({
      account_id: health.account_id,
      status: health.status,
      allowed,
      reason,
      health_reason: health.reason,
      remaining_today: allowed ? remainingToday : 0,
      remaining_week: remainingWeek,
      sent_today: sentToday,
      sent_week: sentWeek,
      last_check_at: health.last_check_at,
      acceptance_rate_7d: health.acceptance_rate_7d,
      caps_li: {
        daily_invitations: dailyCap,
        weekly_invitations: LI_CAP_WEEKLY,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
