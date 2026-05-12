import { NextResponse } from "next/server";
import { getCampaignById } from "@/lib/campaigns";
import { parseQualifiedLeads } from "@/lib/qualified-leads";
import {
  readChildSheet,
  readChildQualifiedLeads,
  updateIndex,
  QUALIFIED_SHEET_RANGE_DATA_ROWS,
} from "@/lib/sheets";

interface RejectedLead {
  lead_id: string;
  campaign_id: string;
  nom: string;
  site: string;
  score: string;
  rejection_reason: string;
  processed_at: string;
}

function parseRejectedLeads(rows: string[][]): RejectedLead[] {
  return rows.map((r) => ({
    lead_id: r[0] ?? "",
    campaign_id: r[1] ?? "",
    nom: r[2] ?? "",
    site: r[3] ?? "",
    score: r[4] ?? "0",
    rejection_reason: r[5] ?? "",
    processed_at: r[6] ?? "",
  }));
}

function parseConfig(rows: string[][]): Record<string, string> {
  const config: Record<string, string> = {};
  for (const row of rows) {
    if (row[0]) config[row[0]] = row[1] ?? "";
  }
  return config;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { statut } = body as { statut: string };

  const VALID_STATUTS = ["active", "generating", "scheduled", "paused", "completed", "archived", "inactive"];
  if (!statut || !VALID_STATUTS.includes(statut)) {
    return NextResponse.json({ error: "statut invalide" }, { status: 400 });
  }

  await updateIndex(id, { statut });
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resolved = await getCampaignById(id);
  if (!resolved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { campaign, sheetId } = resolved;

  const [qualifiedRows, rejectedRows, configRows] = await Promise.all([
    readChildQualifiedLeads(sheetId, id, QUALIFIED_SHEET_RANGE_DATA_ROWS),
    readChildSheet(sheetId, `${id}_Rejected!A2:G`),
    readChildSheet(sheetId, `${id}_Config!A2:C`),
  ]);

  return NextResponse.json({
    campaign,
    leads_qualified: parseQualifiedLeads(qualifiedRows),
    leads_rejected: parseRejectedLeads(rejectedRows),
    config: parseConfig(configRows),
  });
}
