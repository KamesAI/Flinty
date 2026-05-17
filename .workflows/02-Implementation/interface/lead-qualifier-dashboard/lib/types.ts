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

// ——— v4 types ———

export type IntentLabel =
  | "interested"
  | "objection_price"
  | "objection_timing"
  | "objection_need"
  | "objection_trust"
  | "meeting_ready"
  | "off_topic"
  | "unsubscribe"
  | "hostile";

export type ConversationChannel = "email" | "linkedin";
export type ConversationRole = "prospect" | "setter" | "human";

/** GSheet enfant — onglet Conversations (v4) */
export interface ConversationTurn {
  turn_id: string;
  lead_id: string;
  channel: ConversationChannel;
  role: ConversationRole;
  content: string;
  sent_at: string;
  intent: IntentLabel | "";
  validated_by: string;
  edited_from_draft: "true" | "false" | "";
}

/** Index GSheet — onglet Email_Health (v4) */
export type EmailHealthStatus = "active" | "paused_high_bounce" | "paused_high_complaint";

export interface EmailHealth {
  domain: string;
  sent_today: string;
  bounce_rate_7d: string;
  complaint_rate_7d: string;
  last_mail_tester_score: string;
  last_check_at: string;
  status: EmailHealthStatus;
}

/** GSheet enfant — onglet Meetings (v4 étendu) */
export type MeetingBookedVia = "setter" | "manual";
export type MeetingStatusV4 = "booked" | "no_show" | "completed" | "cancelled";

export interface MeetingV4 {
  meeting_id: string;
  lead_id: string;
  calendly_uri: string;
  start_at: string;
  event_type: string;
  booked_via: MeetingBookedVia;
  status: MeetingStatusV4;
}

/** GSheet enfant — onglet Config (v4 rows) */
export interface CampaignConfig {
  setter_enabled: "true" | "false";
  setter_validation: "true" | "false";
  setter_tone: "formal" | "casual";
  setter_signature: string;
  calendly_event_uri: string;
  li_caps_daily: string;
}

/** Index GSheet — onglet Campagnes v4 (extended) */
export interface CampaignV4 extends Campaign {
  setter_enabled: "true" | "false";
  setter_validation: "true" | "false";
  li_account_id: string;
  calendly_event_uri: string;
}

/** Intent classification result from Setter */
export interface IntentResult {
  intent: IntentLabel;
  confidence: number;
  reasoning: string;
}

/** Calendly available slot */
export interface CalendlySlot {
  start_time: string;
  end_time: string;
  scheduling_url: string;
}

/** Pacing check result */
export interface PacingCheckResult {
  allowed: boolean;
  reason?: "paused_high_bounce" | "paused_high_complaint" | "cap_hourly" | "outside_hours" | "domain_not_found";
  next_allowed_at?: string;
}
