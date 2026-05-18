import { NextResponse } from "next/server";
import { createUnipileClient } from "@/lib/unipile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const client = createUnipileClient();
    const link = await client.createHostedAuthLink({
      providers: ["LINKEDIN"],
      successRedirectUrl: `${origin}/api/unipile/callback`,
      failureRedirectUrl: `${origin}/dashboard/settings/linkedin/connect?error=auth_failed`,
    });

    return NextResponse.json({ url: link.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
