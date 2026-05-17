import { NextResponse } from "next/server";
import { z } from "zod";
import { processEmailReply } from "@/lib/replies";

const EmailReplySchema = z.object({
  lead_id: z.string().optional(),
  campaign_id: z.string().optional(),
  from_email: z.string().email().optional(),
  email: z.string().email().optional(),
  content: z.string().trim().min(1),
  sent_at: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = EmailReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  if (!parsed.data.lead_id && !parsed.data.from_email && !parsed.data.email) {
    return NextResponse.json(
      { error: "lead_id ou from_email requis" },
      { status: 422 }
    );
  }

  try {
    const result = await processEmailReply(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    const status = message.includes("introuvable") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
