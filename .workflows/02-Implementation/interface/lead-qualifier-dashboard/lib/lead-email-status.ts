/** Statuts persistés dans Leads_Qualified / colonne statut_email (PRD v3, Kanban). */
export const EMAIL_STATUT_VALUES = [
  "new",
  "contacted",
  "relance_1",
  "relance_2",
  "opened",
  "clicked",
  "replied",
  "bounced",
  "disqualified",
] as const;

export type EmailStatut = (typeof EMAIL_STATUT_VALUES)[number];

const ALLOWED = new Set<string>(EMAIL_STATUT_VALUES);

export function isAllowedEmailStatut(value: string): value is EmailStatut {
  return ALLOWED.has(value);
}
