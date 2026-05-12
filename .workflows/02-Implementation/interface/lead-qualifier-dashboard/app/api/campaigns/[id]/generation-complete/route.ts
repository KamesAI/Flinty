import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { updateIndex } from "@/lib/sheets";

interface GenerationCompleteBody {
  campaign_id?: string;
  raw_count?: number;
  target_raw_leads?: number;
  status?: "completed" | "failed";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as GenerationCompleteBody;

  if (body.campaign_id && body.campaign_id !== id) {
    return NextResponse.json(
      { success: false, message: "campaign_id ne correspond pas à l'URL" },
      { status: 400 }
    );
  }

  const rawCount = Number.isFinite(body.raw_count) ? Number(body.raw_count) : 0;
  const status = body.status === "failed" ? "paused" : "active";

  await updateIndex(id, {
    statut: status,
    total_leads_raw: String(rawCount),
  });

  revalidatePath("/dashboard");

  return NextResponse.json({
    success: true,
    campaign_id: id,
    raw_count: rawCount,
    target_raw_leads: body.target_raw_leads ?? null,
  });
}
