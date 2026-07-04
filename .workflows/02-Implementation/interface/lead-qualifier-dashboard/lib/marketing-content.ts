// Contenu de la landing page Flinty — source unique (sections, plans, FAQ).
// Copy FR, positionnement issu de 00-Discovery/PRD-v4.md.

export interface ProblemItem {
  id: string;
  title: string;
  description: string;
}

export interface Feature {
  id: string;
  number: string;
  title: string;
  hook: string;
  description: string;
  bullets: [string, string, string];
  mockup: "setter" | "inbox" | "scoring" | "sequences" | "booking" | "kanban";
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface ResultStat {
  id: string;
  value: string;
  label: string;
  sublabel: string;
  /** Largeur de la barre de progression sous la stat (0-100, purement visuel) */
  progress: number;
}

export interface FunnelStep {
  id: string;
  value: number;
  label: string;
  /** Taux de conversion par rapport à l'étape précédente, ex. "64 %" */
  rate?: string;
}

export type ComparisonCell = "yes" | "partial" | "no";

export interface ComparisonCompetitor {
  id: string;
  name: string;
}

export interface ComparisonRow {
  id: string;
  feature: string;
  flintyNote: string;
  competitors: Record<string, ComparisonCell>;
  /** Nuance affichée sous une cellule "partial", par id concurrent */
  competitorNotes?: Record<string, string>;
}

export interface BookDemoContent {
  title: string;
  description: string;
  bullets: string[];
  cta: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  tagline: string;
  features: string[];
  popular: boolean;
  cta: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const PROBLEMS: ProblemItem[] = [
  {
    id: "time",
    title: "Des heures avalées par le tri des réponses",
    description:
      "Chaque matin, vous ouvrez votre boîte mail et LinkedIn pour trier, relancer, répondre. Ce temps-là, vous ne le passez ni à vendre, ni à livrer.",
  },
  {
    id: "flat",
    title: "Vos cold emails restent sans suite",
    description:
      "Des messages génériques, des relances oubliées : la plupart des réponses tièdes meurent faute de suivi au bon moment, sur le bon ton.",
  },
  {
    id: "scale",
    title: "Au-delà de 20 prospects, vous perdez le fil",
    description:
      "Qui a répondu quoi ? Qui attend un créneau ? Sans système, la prospection ne passe pas à l'échelle — et les rendez-vous vous échappent.",
  },
];

export const FEATURES: Feature[] = [
  {
    id: "setter",
    number: "01",
    title: "AI Setter",
    hook: "Il lit chaque réponse et transforme l'intérêt en rendez-vous.",
    description:
      "Dès qu'un prospect répond, le Setter analyse l'intention, répond en quelques minutes sur un ton naturel, traite les objections et amène la conversation vers un créneau. Vous n'écrivez plus un seul message.",
    bullets: [
      "Réponse en moins de 5 minutes, 24h/24",
      "Gestion des objections (mirroring, questions calibrées)",
      "Propose vos créneaux au moment où l'intérêt est chaud",
    ],
    mockup: "setter",
  },
  {
    id: "inbox",
    number: "02",
    title: "Inbox unifiée email + LinkedIn",
    hook: "Toutes vos conversations de prospection au même endroit.",
    description:
      "Email et LinkedIn dans un seul fil, avec le statut de chaque échange : en discussion, objection, créneau proposé, rendez-vous booké. Fini les allers-retours entre cinq onglets.",
    bullets: [
      "Fils email et LinkedIn fusionnés par prospect",
      "Statuts clairs sur chaque conversation",
      "Historique complet consultable en un clic",
    ],
    mockup: "inbox",
  },
  {
    id: "scoring",
    number: "03",
    title: "Sourcing & scoring IA",
    hook: "Des leads enrichis et notés avant le premier message.",
    description:
      "Flinty source vos prospects, enrichit chaque fiche sur 14 champs (activité, taille, signaux d'achat…) et score la compatibilité avec votre ICP. Vous ne contactez que les comptes qui en valent la peine.",
    bullets: [
      "Enrichissement IA sur 14 champs par lead",
      "Score de compatibilité avec votre ICP",
      "Tri automatique qualifiés / rejetés",
    ],
    mockup: "scoring",
  },
  {
    id: "sequences",
    number: "04",
    title: "Séquences & relances multi-canal",
    hook: "Chaque prospect est relancé au bon moment, sans y penser.",
    description:
      "Message initial, relances J+3 et J+7, alternance email et LinkedIn : les séquences tournent seules, avec un rythme d'envoi calqué sur un humain pour protéger vos comptes.",
    bullets: [
      "Relances automatiques J+3 / J+7",
      "Cadence humaine anti-détection (pacing engine)",
      "Arrêt automatique dès qu'un prospect répond",
    ],
    mockup: "sequences",
  },
  {
    id: "booking",
    number: "05",
    title: "Booking Calendly natif",
    hook: "Du premier message au créneau réservé, sans intervention.",
    description:
      "Quand un prospect est prêt, le Setter propose directement vos disponibilités Calendly dans la conversation. Le rendez-vous atterrit dans votre agenda, confirmé.",
    bullets: [
      "Créneaux proposés directement dans l'échange",
      "Synchronisation Calendly en temps réel",
      "Confirmation et rappel automatiques",
    ],
    mockup: "booking",
  },
  {
    id: "kanban",
    number: "06",
    title: "CRM kanban & analytics",
    hook: "Votre pipeline de prospection, visible d'un coup d'œil.",
    description:
      "Un kanban à 6 colonnes suit chaque lead du sourcing au rendez-vous, et le dashboard mesure ce qui compte : taux de réponse, rendez-vous bookés, coût par rendez-vous.",
    bullets: [
      "Kanban 6 colonnes, du lead brut au RDV",
      "KPIs par campagne en temps réel",
      "Export multi-format de vos données",
    ],
    mockup: "kanban",
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Connectez vos canaux",
    description: "Email et LinkedIn, reliés en quelques minutes. Calendly pour les créneaux.",
  },
  {
    step: 2,
    title: "Définissez votre cible",
    description: "Décrivez votre client idéal : Flinty source, enrichit et score les prospects.",
  },
  {
    step: 3,
    title: "L'IA contacte et relance",
    description: "Messages personnalisés, relances J+3 / J+7, cadence humaine sur chaque canal.",
  },
  {
    step: 4,
    title: "Le Setter book vos rendez-vous",
    description: "Il répond, qualifie, traite les objections et remplit votre agenda.",
  },
];

export const RESULT_STATS: ResultStat[] = [
  {
    id: "response",
    value: "< 5 min",
    label: "Délai de réponse aux prospects",
    sublabel: "24h/24, dès qu'un prospect répond",
    progress: 92,
  },
  {
    id: "meetings",
    value: "12+",
    label: "RDV qualifiés par mois",
    sublabel: "en pilote automatique",
    progress: 75,
  },
  {
    id: "time-saved",
    value: "45 min",
    label: "Économisées chaque jour",
    sublabel: "sur le tri et les relances",
    progress: 62,
  },
  {
    id: "channels",
    value: "2",
    label: "Canaux orchestrés ensemble",
    sublabel: "email + LinkedIn, une seule inbox",
    progress: 100,
  },
];

export const FUNNEL_STEPS: FunnelStep[] = [
  { id: "sourced", value: 500, label: "Prospects sourcés et enrichis" },
  { id: "qualified", value: 320, label: "Qualifiés par le scoring IA", rate: "64 %" },
  { id: "replied", value: 58, label: "Réponses obtenues", rate: "18 %" },
  { id: "booked", value: 12, label: "Rendez-vous bookés", rate: "21 %" },
];

export const FUNNEL_NOTE =
  "Projection illustrative d'une campagne type, basée sur les objectifs produit — pas des métriques clients mesurées. Vos résultats dépendront de votre marché et de votre ciblage.";

export const COMPARISON_COMPETITORS: ComparisonCompetitor[] = [
  { id: "lemlist", name: "Lemlist" },
  { id: "waalaxy", name: "Waalaxy" },
  { id: "lgm", name: "La Growth Machine" },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: "setter",
    feature: "AI Setter qui mène la conversation après la première réponse",
    flintyNote: "objections, questions, créneaux",
    competitors: { lemlist: "no", waalaxy: "no", lgm: "no" },
  },
  {
    id: "scoring",
    feature: "Scoring & enrichissement IA avant le premier message",
    flintyNote: "14 champs par lead",
    competitors: { lemlist: "partial", waalaxy: "partial", lgm: "partial" },
    competitorNotes: {
      lemlist: "enrichissement, sans scoring ICP",
      waalaxy: "email finder",
      lgm: "enrichissement, sans scoring ICP",
    },
  },
  {
    id: "booking",
    feature: "Créneaux Calendly proposés directement dans la conversation",
    flintyNote: "sans intervention humaine",
    competitors: { lemlist: "partial", waalaxy: "no", lgm: "no" },
    competitorNotes: { lemlist: "page de booking, hors conversation" },
  },
  {
    id: "validation",
    feature: "Mode validation : relire chaque brouillon IA avant envoi",
    flintyNote: "puis passage en autonome",
    competitors: { lemlist: "no", waalaxy: "no", lgm: "no" },
  },
  {
    id: "inbox",
    feature: "Inbox unifiée email + LinkedIn avec statuts de qualification",
    flintyNote: "en discussion, objection, RDV…",
    competitors: { lemlist: "partial", waalaxy: "partial", lgm: "yes" },
    competitorNotes: {
      lemlist: "inbox sans statuts de qualification",
      waalaxy: "inbox LinkedIn",
    },
  },
  {
    id: "cost",
    feature: "Coût par rendez-vous suivi dans le CRM",
    flintyNote: "par campagne, en temps réel",
    competitors: { lemlist: "no", waalaxy: "no", lgm: "no" },
  },
];

export const COMPARISON_DISCLAIMER =
  "Comparatif indicatif établi en juillet 2026 à partir des sites éditeurs. Les fonctionnalités évoluent — vérifiez avant toute décision. Flinty n'est affilié à aucun des outils cités.";

export const BOOK_DEMO: BookDemoContent = {
  title: "Voyez Flinty en action",
  description:
    "30 minutes pour parcourir votre cas : ciblage, séquences, AI Setter. Repartez avec un plan de prospection concret, que vous signiez ou non.",
  bullets: ["30 minutes, en visio", "Sur votre marché et votre ICP", "Sans engagement"],
  cta: "Réserver une démo",
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49,
    tagline: "Pour lancer vos premières campagnes email",
    features: [
      "Sourcing & scoring IA (14 champs)",
      "Campagnes email + relances J+3 / J+7",
      "Générateur d'ICP",
      "Kanban & analytics",
    ],
    popular: false,
    cta: "Commencer",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 99,
    tagline: "La boucle complète, jusqu'au rendez-vous booké",
    features: [
      "Tout Starter",
      "AI Setter : réponses & objections automatiques",
      "Canal LinkedIn + inbox unifiée",
      "Booking Calendly natif",
      "Mode validation (brouillons avant envoi)",
    ],
    popular: true,
    cta: "Commencer",
  },
  {
    id: "agency",
    name: "Agence",
    monthlyPrice: 149,
    tagline: "Pour prospecter au nom de vos clients",
    features: [
      "Tout Pro",
      "Multi-comptes / multi-clients",
      "Le Setter parle au nom de chaque client",
      "Support prioritaire",
    ],
    popular: false,
    cta: "Commencer",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "ban",
    question: "Mon compte LinkedIn risque-t-il d'être banni ?",
    answer:
      "Flinty intègre un pacing engine qui reproduit une cadence humaine : volumes limités, horaires réalistes, pauses aléatoires. C'est précisément pour réduire ce risque que le rythme d'envoi est bridé — la sécurité de vos comptes passe avant le volume.",
  },
  {
    id: "control",
    question: "Est-ce que je garde le contrôle sur ce que l'IA envoie ?",
    answer:
      "Oui. Le mode validation vous permet de relire chaque brouillon avant envoi. Quand vous êtes en confiance, vous passez le Setter en autonome — et vous pouvez reprendre la main sur n'importe quelle conversation à tout moment.",
  },
  {
    id: "ai-act",
    question: "Les prospects savent-ils qu'ils parlent à une IA ?",
    answer:
      "Flinty est conçu pour être conforme à l'AI Act européen (article 50) : la transparence sur l'usage de l'IA est intégrée au produit, sans casser la fluidité de la conversation.",
  },
  {
    id: "setup",
    question: "Combien de temps prend la mise en place ?",
    answer:
      "Comptez une quinzaine de minutes : connexion de vos canaux, description de votre client idéal, et votre première campagne peut partir. Aucune compétence technique requise.",
  },
  {
    id: "channels",
    question: "Quels canaux sont couverts ?",
    answer:
      "Email et LinkedIn, pilotés depuis la même inbox. C'est l'une des différences majeures de Flinty face aux outils mono-canal : vos séquences alternent les deux pour maximiser les réponses.",
  },
  {
    id: "cancel",
    question: "Puis-je annuler à tout moment ?",
    answer:
      "Oui, l'abonnement est sans engagement : vous annulez en un clic depuis vos paramètres, et vous gardez l'accès jusqu'à la fin de la période en cours.",
  },
  {
    id: "data",
    question: "Où sont stockées mes données ?",
    answer:
      "Vos données de campagne restent isolées par espace de travail et ne sont jamais partagées entre clients. Flinty est hébergé en Europe et conçu dans une logique RGPD.",
  },
];
