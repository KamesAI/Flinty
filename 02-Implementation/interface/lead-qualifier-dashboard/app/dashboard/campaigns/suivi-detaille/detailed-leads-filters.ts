import type { QualifiedLeadDetailed } from "@/lib/sheets-detailed";

export interface QualifiedLeadFilters {
  query: string;
  statuses: string[];
  secteurs: string[];
  minScore: number;
  maxScore: number;
}

export type SortKey = keyof QualifiedLeadDetailed | null;
export type SortDirection = "asc" | "desc";

export interface SortState {
  by: SortKey;
  dir: SortDirection;
}

const NUMERIC_KEYS = new Set<string>(["score", "web_quality_score"]);

export function filterQualifiedLeads(
  leads: QualifiedLeadDetailed[],
  filters: QualifiedLeadFilters
): QualifiedLeadDetailed[] {
  const q = filters.query.trim().toLowerCase();
  return leads.filter((lead) => {
    if (q) {
      const haystack = [lead.nom, lead.prénom, lead.email, lead.site]
        .map((v) => (v ?? "").toLowerCase())
        .join(" ");
      if (!haystack.includes(q)) return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(lead.statut_email)) {
      return false;
    }

    if (filters.secteurs.length > 0 && !filters.secteurs.includes(lead.secteur)) {
      return false;
    }

    const score = parseInt(lead.score || "0", 10) || 0;
    if (score < filters.minScore || score > filters.maxScore) {
      return false;
    }

    return true;
  });
}

export function sortQualifiedLeads(
  leads: QualifiedLeadDetailed[],
  state: SortState
): QualifiedLeadDetailed[] {
  if (!state.by) return leads;
  const key = state.by;
  const dir = state.dir === "asc" ? 1 : -1;
  const isNumeric = NUMERIC_KEYS.has(key as string);

  return [...leads].sort((a, b) => {
    const av = a[key] ?? "";
    const bv = b[key] ?? "";
    if (isNumeric) {
      return (parseInt(av || "0", 10) - parseInt(bv || "0", 10)) * dir;
    }
    return av.toString().localeCompare(bv.toString(), "fr", { sensitivity: "base" }) * dir;
  });
}

/** Valeurs distinctes d'un champ pour alimenter un filtre multiselect. */
export function distinctValues(
  leads: QualifiedLeadDetailed[],
  key: keyof QualifiedLeadDetailed
): string[] {
  const set = new Set<string>();
  for (const lead of leads) {
    const v = lead[key];
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}
