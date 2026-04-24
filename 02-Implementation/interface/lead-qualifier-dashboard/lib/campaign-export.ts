import type { QualifiedLead } from "./qualified-leads";

/** PRD v3 — 16 colonnes export CSV standard (hors IDs / statut opérationnel / signals bruts). */
export const QUALIFIED_CSV_COLUMNS = [
  "nom",
  "site",
  "ville",
  "score",
  "score_reason",
  "email",
  "prénom",
  "poste",
  "secteur",
  "taille_equipe",
  "has_ia_services",
  "hiring_signals",
  "growth_stage",
  "buying_signal",
  "personalized_hook",
  "web_quality_score",
] as const satisfies readonly (keyof QualifiedLead)[];

export function csvRfc4180Cell(value: string): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export function qualifiedLeadsToCsv(leads: QualifiedLead[]): string {
  const header = QUALIFIED_CSV_COLUMNS.map((k) => csvRfc4180Cell(k)).join(",");
  const lines = leads.map((lead) =>
    QUALIFIED_CSV_COLUMNS.map((k) => csvRfc4180Cell(lead[k] ?? "")).join(",")
  );
  return `\uFEFF${[header, ...lines].join("\r\n")}`;
}

const INSTANTLY_HEADERS = [
  "Email",
  "First Name",
  "Last Name",
  "Company Name",
  "Personalization",
] as const;

export function qualifiedLeadsToInstantlyCsv(leads: QualifiedLead[]): string {
  const header = INSTANTLY_HEADERS.map((h) => csvRfc4180Cell(h)).join(",");
  const withEmail = leads.filter((l) => (l.email ?? "").trim().length > 0);
  const lines = withEmail.map((lead) =>
    [
      csvRfc4180Cell(lead.email.trim()),
      csvRfc4180Cell(lead.prénom ?? ""),
      csvRfc4180Cell(""),
      csvRfc4180Cell(lead.nom ?? ""),
      csvRfc4180Cell(lead.personalized_hook ?? ""),
    ].join(",")
  );
  return `\uFEFF${[header, ...lines].join("\r\n")}`;
}

export function qualifiedLeadsToJson(leads: QualifiedLead[]): string {
  return JSON.stringify(leads, null, 2);
}
