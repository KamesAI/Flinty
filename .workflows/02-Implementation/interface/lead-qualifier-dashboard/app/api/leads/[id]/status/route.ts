import { NextResponse } from "next/server";
import { isAllowedEmailStatut } from "@/lib/lead-email-status";
import { readChildSheet, updateChildSheetValues } from "@/lib/sheets";

/** Colonne statut_email sur l'onglet `{campaign_id}_Qualified` (19ᵉ colonne, v3). */
const STATUT_EMAIL_COLUMN = "S";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { sheet_id, campaign_id, statut_email } = body as Record<string, unknown>;

  if (typeof sheet_id !== "string" || !sheet_id.trim()) {
    return NextResponse.json({ error: "sheet_id requis" }, { status: 400 });
  }
  if (typeof campaign_id !== "string" || !campaign_id.trim()) {
    return NextResponse.json({ error: "campaign_id requis" }, { status: 400 });
  }
  if (typeof statut_email !== "string" || !isAllowedEmailStatut(statut_email)) {
    return NextResponse.json({ error: "statut_email invalide" }, { status: 400 });
  }

  const qualifiedTab = `${campaign_id}_Qualified`;
  const rows = await readChildSheet(sheet_id, `${qualifiedTab}!A:A`);
  const rowIndex = rows.findIndex((r) => (r[0] ?? "") === leadId);
  if (rowIndex === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sheetRowNumber = rowIndex + 1;
  const range = `${qualifiedTab}!${STATUT_EMAIL_COLUMN}${sheetRowNumber}`;
  await updateChildSheetValues(sheet_id, range, [[statut_email]]);

  return NextResponse.json({ ok: true });
}
