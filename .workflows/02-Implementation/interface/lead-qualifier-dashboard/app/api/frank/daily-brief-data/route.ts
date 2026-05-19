import { NextResponse } from "next/server";
import { generateDailyPipelineBriefData } from "@/lib/frank-daily-brief";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await generateDailyPipelineBriefData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
