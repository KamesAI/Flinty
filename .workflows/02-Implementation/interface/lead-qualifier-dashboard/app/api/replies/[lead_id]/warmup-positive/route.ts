import { NextResponse } from "next/server";
import { z } from "zod";
import { markWarmupPositiveReply } from "@/lib/replies";

const BodySchema = z.object({
  turn_id: z.string().min(1),
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const turn = await markWarmupPositiveReply({ lead_id, turn_id: parsed.data.turn_id });
    return NextResponse.json({ ok: true, turn });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
