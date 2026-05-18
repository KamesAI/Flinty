import { NextResponse } from "next/server";
import { getLatestLinkedInAccount } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const account = await getLatestLinkedInAccount();
    if (!account) {
      return NextResponse.json({
        status: "disconnected",
        account_id: "",
        connected_at: "",
      });
    }

    return NextResponse.json(account);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
