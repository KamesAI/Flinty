import { NextResponse } from "next/server";
import { updateIndex } from "@/lib/sheets";
import { notifyLeadsQualifiedSafe } from "@/lib/crm-notify";

interface QualificationCompleteBody {
  campaign_id?: string;
  qualified_count?: number;
  status?: "completed" | "failed";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as QualificationCompleteBody;

  if (body.campaign_id && body.campaign_id !== id) {
    return NextResponse.json(
      { success: false, message: "campaign_id ne correspond pas à l'URL" },
      { status: 400 }
    );
  }

  const nextStatut = body.status === "failed" ? "paused" : "active";

  const patch: Parameters<typeof updateIndex>[1] = { statut: nextStatut };
  let qualifiedCountReported: number | null = null;
  if (body.qualified_count !== undefined && body.qualified_count !== null) {
    const n = Number(body.qualified_count);
    if (Number.isFinite(n) && n >= 0) {
      qualifiedCountReported = n;
      patch.total_leads_qualified = String(n);
    }
  }

  await updateIndex(id, patch);

  // Webhook CRM outbound (v4-034) — no-op si crm_webhook_url absent de la Config.
  if (body.status !== "failed") {
    await notifyLeadsQualifiedSafe(id);
  }

  return NextResponse.json({
    success: true,
    campaign_id: id,
    qualified_count: qualifiedCountReported,
  });
}
