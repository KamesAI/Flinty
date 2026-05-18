import { NextResponse } from "next/server";
import { buildCalendlyAuthUrl } from "@/lib/calendly";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspaces";

export async function GET(req: Request) {
  const clientId = process.env.CALENDLY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "CALENDLY_CLIENT_ID manquant" }, { status: 503 });
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/calendly/auth/callback`;
  const workspaceId = req.headers.get("x-workspace-id") ?? DEFAULT_WORKSPACE_ID;

  const url = buildCalendlyAuthUrl(clientId, redirectUri);
  const response = NextResponse.redirect(url);
  response.cookies.set("calendly_oauth_workspace", workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
