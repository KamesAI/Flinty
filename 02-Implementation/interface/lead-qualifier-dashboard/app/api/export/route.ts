import { getSheetData, parseLeads, type Lead } from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaign_id = searchParams.get("campaign_id");

  const rows = await getSheetData("Leads_Qualified!A:P");
  let leads = parseLeads(rows);
  if (campaign_id) leads = leads.filter((l) => l.campaign_id === campaign_id);

  const headers: Array<keyof Lead> = [
    "lead_id",
    "campaign_id",
    "nom",
    "site",
    "ville",
    "score",
    "email",
    "téléphone",
    "prénom",
    "poste",
    "secteur",
    "taille_equipe",
    "has_ia_services",
    "statut_email",
  ];
  const csv = [
    headers.join(","),
    ...leads.map((lead) => headers.map((header) => `"${lead[header] ?? ""}"`).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leads_export.csv"`,
    },
  });
}
