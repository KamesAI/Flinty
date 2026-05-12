/** Ligne `campaign_id_Qualified` (A2:AA) — v4. */
export interface QualifiedLead {
  lead_id: string;
  campaign_id: string;
  nom: string;
  site: string;
  ville: string;
  score: string;
  score_reason: string;
  email: string;
  téléphone: string;
  prénom: string;
  poste: string;
  secteur: string;
  taille_equipe: string;
  has_ia_services: string;
  hiring_signals: string;
  growth_stage: string;
  buying_signal: string;
  personalized_hook: string;
  statut_email: string;
  web_quality_score: string;
  web_quality_signals: string;
  societe: string;
  prenom_gerant: string;
  nom_gerant: string;
  email_gerant: string;
  email_type: string;
  email_confidence: string;
}

export function parseQualifiedLeads(rows: string[][]): QualifiedLead[] {
  return rows.map((r) => ({
    lead_id: r[0] ?? "",
    campaign_id: r[1] ?? "",
    nom: r[2] ?? "",
    site: r[3] ?? "",
    ville: r[4] ?? "",
    score: r[5] ?? "0",
    score_reason: r[6] ?? "",
    email: r[7] ?? "",
    téléphone: r[8] ?? "",
    prénom: r[9] ?? "",
    poste: r[10] ?? "",
    secteur: r[11] ?? "",
    taille_equipe: r[12] ?? "",
    has_ia_services: r[13] ?? "",
    hiring_signals: r[14] ?? "",
    growth_stage: r[15] ?? "",
    buying_signal: r[16] ?? "",
    personalized_hook: r[17] ?? "",
    statut_email: r[18] ?? "new",
    web_quality_score: r[19] ?? "",
    web_quality_signals: r[20] ?? "",
    societe: r[21] ?? r[2] ?? "",
    prenom_gerant: r[22] ?? r[9] ?? "",
    nom_gerant: r[23] ?? "",
    email_gerant: r[24] ?? r[7] ?? "",
    email_type: r[25] ?? "",
    email_confidence: r[26] ?? "",
  }));
}
