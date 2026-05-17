import { NextResponse } from "next/server";
import { z } from "zod";
import { triggerSetterSend } from "@/lib/replies";

const SendSchema = z.object({
  turn_id: z.string().min(1),
  validated_by: z.string().min(1).default("Thomas"),
  edited_content: z.string().optional(),
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

  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    await triggerSetterSend({ lead_id, ...parsed.data });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    const status = message.includes("introuvable") ? 404 : message.includes("N8N_WF8") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
