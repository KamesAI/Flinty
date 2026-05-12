/** Index GSheet — onglet Campagnes (v3) */
export interface Campaign {
  campaign_id: string;
  nom: string;
  sheet_id: string;
  sheet_url: string;
  secteur: string;
  localisation: string;
  offre_kames: string;
  statut: "new" | "active" | "paused" | "done";
  date_création: string;
  total_leads_raw: string;
  total_leads_qualified: string;
  emails_envoyés: string;
  taux_réponse: string;
}

/** GSheet enfant — onglet Leads_Qualified (v3) */
export interface Lead {
  lead_id: string;
  campaign_id: string;
  nom: string;
  prénom: string;
  poste: string;
  secteur: string;
  email: string;
  téléphone: string;
  score: string;
  site: string;
  ville: string;
  taille_equipe: string;
  has_ia_services: string;
  statut_email:
    | "new"
    | "contacted"
    | "relance_1"
    | "relance_2"
    | "opened"
    | "clicked"
    | "replied"
    | "bounced"
    | "disqualified";
  resend_email_id: string;
  last_email_sent_at?: string;
}

/** Index GSheet — onglet Contacts_Registry */
export interface ContactRegistryEntry {
  domain: string;
  last_contacted_at: string;
  campaign_id: string;
  statut: string;
}
