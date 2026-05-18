import { NextResponse } from "next/server";
import { getLatestLinkedInHealth } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getLatestLinkedInHealth();
    if (!health) {
      return NextResponse.json({
        account_id: "",
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
