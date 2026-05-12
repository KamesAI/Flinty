import { getCampaignById } from "@/lib/campaigns";
import {
  qualifiedLeadsToCsv,
  qualifiedLeadsToInstantlyCsv,
  qualifiedLeadsToJson,
} from "@/lib/campaign-export";
import { parseQualifiedLeads } from "@/lib/qualified-leads";
import {
  readChildQualifiedLeads,
  QUALIFIED_SHEET_RANGE_DATA_ROWS,
} from "@/lib/sheets";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  if (format !== "csv" && format !== "json" && format !== "instantly") {
    return new Response(
      JSON.stringify({ error: "format requis : csv | json | instantly" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const resolved = await getCampaignById(id);
  if (!resolved) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sheetId } = resolved;
  const rows = await readChildQualifiedLeads(sheetId, id, QUALIFIED_SHEET_RANGE_DATA_ROWS);
  const leads = parseQualifiedLeads(rows);

  const base = `flinty-${id}`;

  if (format === "csv") {
    const body = qualifiedLeadsToCsv(leads);
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}-qualified.csv"`,
      },
    });
  }

  if (format === "json") {
    const body = qualifiedLeadsToJson(leads);
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}-leads.json"`,
      },
    });
  }

  const body = qualifiedLeadsToInstantlyCsv(leads);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}-instantly.csv"`,
    },
  });
}
