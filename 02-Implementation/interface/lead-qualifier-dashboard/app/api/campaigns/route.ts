import { NextResponse } from "next/server";
import { getSheetData, parseCampaigns, appendRow } from "@/lib/sheets";

export async function GET() {
  const rows = await getSheetData("Campagnes!A:L");
  const campaigns = parseCampaigns(rows);
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { nom, secteur, localisation, taille_equipe, poste, offre_kames, template_email } = body;

  const campaign_id = `camp_${Date.now()}`;
  const date_création = new Date().toISOString().split("T")[0];

  await appendRow("Campagnes!A:L", [
    campaign_id, nom, secteur, localisation, date_création,
    offre_kames, "generating", "0", "0", "0", "0", "0",
  ]);

  // Trigger n8n WF1
  const n8nUrl = process.env.N8N_WF1_WEBHOOK;
  if (n8nUrl) {
    await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id, nom, secteur, localisation, taille_equipe, poste, offre_kames, template_email }),
    }).catch(console.error);
  }

  return NextResponse.json({ campaign_id }, { status: 201 });
}
