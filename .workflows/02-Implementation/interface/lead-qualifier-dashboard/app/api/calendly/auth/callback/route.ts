import { NextResponse } from "next/server";
import { exchangeCalendlyCode } from "@/lib/calendly";
import { upsertCalendlyAccount } from "@/lib/sheets";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspaces";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings/calendly/connect?error=${error ?? "missing_code"}`, url.origin)
    );
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const workspaceId =
    cookieHeader.match(/calendly_oauth_workspace=([^;]+)/)?.[1] ?? DEFAULT_WORKSPACE_ID;

  try {
    const redirectUri = `${url.origin}/api/calendly/auth/callback`;
    const tokens = await exchangeCalendlyCode(code, redirectUri);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await upsertCalendlyAccount({
      account_id: `calendly-${workspaceId}`,
      type: "calendly",
      provider: "calendly",
      status: "connected",
      connected_at: new Date().toISOString(),
      workspace_id: workspaceId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
    });

    const response = NextResponse.redirect(
      new URL("/dashboard/settings/calendly/connect?success=1", url.origin)
    );
    response.cookies.delete("calendly_oauth_workspace");
    return response;
  } catch (err) {
    console.error("[calendly/callback]", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings/calendly/connect?error=token_exchange", url.origin)
    );
  }
}
