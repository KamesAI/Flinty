import { NextResponse } from "next/server";
import { z } from "zod";
import { escalateSetterDraft } from "@/lib/replies";

const EscalateSchema = z.object({
  turn_id: z.string().min(1),
  escalated_by: z.string().min(1).default("Thomas"),
  reason: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lead_id: string }> }
) {
  const { lead_id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = EscalateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    await escalateSetterDraft({ lead_id, ...parsed.data });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    const status = message.includes("introuvable") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
