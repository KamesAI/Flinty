export type KanbanColumnKey = "opportunites" | "contactes" | "clients" | "ecartes";

export type KanbanLead = {
  lead_id: string;
  nom: string;
  ville: string;
  score: string;
  statut_email: string;
  personalized_hook: string;
  secteur: string;
  poste: string;
  site: string;
  téléphone: string;
  email: string;
};

export type KanbanColumn = {
  key: KanbanColumnKey;
  label: string;
  statuts: string[];
  border: string;
  text: string;
  bg: string;
  scoreColor: (score: number) => string;
};

const scoreColorFn = (s: number) =>
  s >= 70 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-slate-500";

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    key: "opportunites",
    label: "Opportunités",
    statuts: ["new"],
    border: "border-blue-200",
    text: "text-blue-700",
    bg: "bg-blue-50",
    scoreColor: scoreColorFn,
  },
  {
    key: "contactes",
    label: "Contactés",
    statuts: ["contacted", "relance_1", "relance_2", "opened", "clicked"],
    border: "border-amber-200",
    text: "text-[#059669]",
    bg: "bg-[#059669]/5",
    scoreColor: scoreColorFn,
  },
  {
    key: "clients",
    label: "Clients",
    statuts: ["replied"],
    border: "border-emerald-200",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    scoreColor: scoreColorFn,
  },
  {
    key: "ecartes",
    label: "Écartés",
    statuts: ["bounced", "disqualified"],
    border: "border-red-200",
    text: "text-red-600",
    bg: "bg-red-50",
    scoreColor: scoreColorFn,
  },
];

export const COLUMN_PRIMARY_STATUT: Record<KanbanColumnKey, string> = {
  opportunites: "new",
  contactes: "contacted",
  clients: "replied",
  ecartes: "bounced",
};

const STATUT_TO_COLUMN: Record<string, KanbanColumnKey> = {};
for (const col of KANBAN_COLUMNS) {
  for (const s of col.statuts) {
    STATUT_TO_COLUMN[s] = col.key;
  }
}

export type KanbanGroups = Record<KanbanColumnKey, KanbanLead[]>;

export function groupLeadsByColumn(leads: KanbanLead[]): KanbanGroups {
  const groups: KanbanGroups = {
    opportunites: [],
    contactes: [],
    clients: [],
    ecartes: [],
  };
  for (const lead of leads) {
    const col = STATUT_TO_COLUMN[lead.statut_email] ?? "opportunites";
    groups[col].push(lead);
  }
  return groups;
}
