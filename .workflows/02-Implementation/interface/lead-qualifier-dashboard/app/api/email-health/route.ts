import { NextResponse } from "next/server";
import { getEmailHealth } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const domain = new URL(req.url).searchParams.get("domain") || "outreach.kamesai.com";
    const emailHealth = await getEmailHealth(domain);

    if (!emailHealth) {
      return NextResponse.json({
        domain,
        allowed: false,
        reason: "domain_not_found",
        status: "domain_not_found",
      });
    }

    const allowed = emailHealth.status === "active";

    return NextResponse.json({
      ...emailHealth,
      allowed,
      reason: allowed ? undefined : emailHealth.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
