import { NextResponse } from "next/server";
import { invalidateCampaignSheetIdCache } from "@/lib/cache";
import { listCampaigns } from "@/lib/campaigns";
import { postCampaignBodySchema } from "@/lib/api-schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { appendIndex, createChildGSheet } from "@/lib/sheets";
import { withValidation } from "@/lib/with-validation";

function generateCampaignId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "cmp_";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function GET() {
  const campaigns = await listCampaigns();
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`post-campaign:${ip}`, 10, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes", retryAfter: rl.retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    );
  }

  const validated = await withValidation(req, postCampaignBodySchema);
  if (!validated.ok) return validated.response;

  const {
    nom,
    secteur,
    localisation,
    villes,
    offre_kames,
    taille_equipe,
    poste_cible,
    template_email,
    score_minimum,
  } = validated.data;
  const icp_md = validated.data.icp_md.trim();

  const campaign_id = generateCampaignId();
  const now = new Date();
  const date_création = now.toISOString().slice(0, 10);
  const sheet_name = nom;
  const villesResolved = villes ?? localisation;
  const scoreMinimumStr = String(score_minimum);

  try {
    // 1. Créer les onglets de la campagne dans GOOGLE_CAMPAIGNS_SHEET_ID
    const { spreadsheetId, sheetUrl } = await createChildGSheet(sheet_name, {
      campaign_id,
      icp_md,
      secteur,
      villes: villesResolved,
      taille_equipe: taille_equipe ?? "",
      poste_cible: poste_cible ?? "",
      offre_kames,
      template_email: template_email ?? "j0_default",
      score_minimum: scoreMinimumStr,
    });

    // 2. Écrire dans l'Index maître (13 colonnes v3)
    await appendIndex([
      campaign_id,
      sheet_name,
      spreadsheetId,
      sheetUrl,
      secteur,
      localisation,
      offre_kames,
      "new",
      date_création,
      "0",
      "0",
      "0",
      "0",
    ]);

    // 3. Déclencher WF1 (fire-and-forget — scraping Google Maps)
    const wf1Url = process.env.N8N_WF1_WEBHOOK;
    if (wf1Url) {
      fetch(wf1Url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id,
          spreadsheet_id: spreadsheetId,
          tab_raw: `${campaign_id}_Raw`,
          secteur,
          localisation,
          villes: villesResolved,
          offre_kames,
          taille_equipe: taille_equipe ?? "",
          poste_cible: poste_cible ?? "",
          template_email: template_email ?? "j0_default",
          icp_md,
        }),
      }).catch(console.error);
    }

    invalidateCampaignSheetIdCache();

    return NextResponse.json(
      { campaign_id, spreadsheet_id: spreadsheetId, sheet_url: sheetUrl },
      { status: 202 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/campaigns]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = (err as { status?: number })?.status ?? 500;
    const errors = (err as { errors?: unknown[] })?.errors ?? [];
    return NextResponse.json({ error: message, status, errors }, { status: 500 });
  }
}
