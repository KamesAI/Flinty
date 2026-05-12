export type CampaignQuestionKey =
  | "secteur_cible"
  | "pain_points"
  | "taille_entreprise"
  | "budget_cible"
  | "zones_geo"
  | "proposition_valeur"
  | "signaux_achat"
  | "signaux_exclusion";

export type CampaignQuestion = {
  key: CampaignQuestionKey;
  text: string;
  placeholder: string;
};

export const CAMPAIGN_QUESTIONS: readonly CampaignQuestion[] = [
  {
    key: "secteur_cible",
    text: "Quel secteur veux-tu cibler ?",
    placeholder: "ex : plombiers, cabinets d'avocats d'affaires, agences SEO…",
  },
  {
    key: "pain_points",
    text: "Quels sont les pain points principaux de cette cible ?",
    placeholder: "ex : appels manqués le soir, pas de suivi des devis…",
  },
  {
    key: "taille_entreprise",
    text: "Quelle taille d'entreprise vises-tu ?",
    placeholder: "ex : 1-10 salariés, 50-200 salariés…",
  },
  {
    key: "budget_cible",
    text: "Quel budget mensuel ta cible peut-elle dégager pour ta solution ?",
    placeholder: "ex : 200-500€/mois, >2000€/mois…",
  },
  {
    key: "zones_geo",
    text: "Quelles zones géographiques cibler ?",
    placeholder: "ex : Bordeaux + Bayonne, Île-de-France, France entière…",
  },
  {
    key: "proposition_valeur",
    text: "Quelle est ta proposition de valeur en une phrase ?",
    placeholder: "ex : un standard IA qui ne rate plus aucun appel client.",
  },
  {
    key: "signaux_achat",
    text: "Quels signaux d'achat doit-on repérer ?",
    placeholder: "ex : recrutement en cours, levée de fonds, site daté…",
  },
  {
    key: "signaux_exclusion",
    text: "Quels signaux excluent un lead ?",
    placeholder: "ex : <2 avis Google, secteur réglementé, pas de site…",
  },
] as const;

export type ChatState = {
  answers: string[];
  currentIndex: number;
};

export function initialChatState(): ChatState {
  return { answers: [], currentIndex: 0 };
}

export function currentQuestion(state: ChatState): CampaignQuestion | null {
  return CAMPAIGN_QUESTIONS[state.currentIndex] ?? null;
}

export function getDraftAnswer(state: ChatState): string {
  return state.answers[state.currentIndex] ?? "";
}

export function submitAnswer(state: ChatState, raw: string): ChatState {
  const trimmed = raw.trim();
  if (!trimmed) return state;
  const answers = [...state.answers];
  answers[state.currentIndex] = trimmed;
  return {
    answers,
    currentIndex: Math.min(state.currentIndex + 1, CAMPAIGN_QUESTIONS.length),
  };
}

export function goBack(state: ChatState): ChatState {
  if (state.currentIndex === 0) return state;
  return { ...state, currentIndex: state.currentIndex - 1 };
}

export function isComplete(state: ChatState): boolean {
  return (
    state.answers.length === CAMPAIGN_QUESTIONS.length &&
    state.currentIndex >= CAMPAIGN_QUESTIONS.length
  );
}
