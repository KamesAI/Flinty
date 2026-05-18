import { NextResponse } from "next/server";
import { upsertLinkedInAccount } from "@/lib/sheets";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const accountId = url.searchParams.get("account_id");
  const settingsUrl = new URL("/dashboard/settings/linkedin/connect", url.origin);

  if (!accountId) {
    settingsUrl.searchParams.set("error", "missing_account_id");
    return NextResponse.redirect(settingsUrl);
  }

  const statusParam = url.searchParams.get("status") || "connected";
  const status = statusParam === "paused" || statusParam === "expired" ? statusParam : "connected";

  await upsertLinkedInAccount({
    account_id: accountId,
    type: "linkedin",
    provider: "unipile",
    status,
    connected_at: new Date().toISOString(),
    paused_reason: "",
    pause_started_at: "",
    workspace_id: DEFAULT_WORKSPACE_ID,
  });

  settingsUrl.searchParams.set("success", "true");
  return NextResponse.redirect(settingsUrl);
}
