export type CampaignBoardBucket =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "stopped";

export interface CampaignBoardCardInput {
  id: string;
  href: string;
  name: string;
  segment: string;
  rawStatus: string;
  qualified: number;
  contacted: number;
  replies: number;
  openRate: number;
}

export interface CampaignBoardCard extends CampaignBoardCardInput {
  badgeLabel: string;
  badgeTone: "draft" | "generating" | "active" | "paused" | "completed" | "stopped";
}

export interface CampaignBoardColumn {
  id: CampaignBoardBucket;
  title: string;
  hint: string;
  accent?: boolean;
  cards: CampaignBoardCard[];
}

export interface CampaignBoardModel {
  activeColumns: CampaignBoardColumn[];
  archivedColumns: CampaignBoardColumn[];
}

function getBucket(rawStatus: string): CampaignBoardBucket {
  if (rawStatus === "new" || rawStatus === "draft") {
    return "draft";
  }

  if (rawStatus === "paused") {
    return "paused";
  }

  if (rawStatus === "completed") {
    return "completed";
  }

  if (rawStatus === "archived" || rawStatus === "inactive") {
    return "stopped";
  }

  return "active";
}

function getBadgeTone(rawStatus: string): CampaignBoardCard["badgeTone"] {
  if (rawStatus === "new" || rawStatus === "draft") {
    return "draft";
  }

  if (rawStatus === "generating") {
    return "generating";
  }

  if (rawStatus === "paused") {
    return "paused";
  }

  if (rawStatus === "completed") {
    return "completed";
  }

  if (rawStatus === "archived" || rawStatus === "inactive") {
    return "stopped";
  }

  return "active";
}

function getBadgeLabel(rawStatus: string) {
  const tone = getBadgeTone(rawStatus);

  if (tone === "draft") return "draft";
  if (tone === "generating") return "generating";
  if (tone === "paused") return "paused";
  if (tone === "completed") return "completed";
  if (tone === "stopped") return "stopped";
  return "active";
}

function toCard(input: CampaignBoardCardInput): CampaignBoardCard {
  return {
    ...input,
    badgeTone: getBadgeTone(input.rawStatus),
    badgeLabel: getBadgeLabel(input.rawStatus),
  };
}

/** Retire une campagne des colonnes actives et l’ajoute à « Arrêtées » (statut archivé côté Index). */
export function moveCampaignToArchived(
  activeColumns: CampaignBoardColumn[],
  archivedColumns: CampaignBoardColumn[],
  cardId: string,
): { activeColumns: CampaignBoardColumn[]; archivedColumns: CampaignBoardColumn[] } | null {
  let found: CampaignBoardCard | undefined;

  const nextActive = activeColumns.map((col) => {
    const idx = col.cards.findIndex((c) => c.id === cardId);
    if (idx === -1) return col;
    found = col.cards[idx];
    return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
  });

  if (!found) return null;

  const archivedCard = toCard({ ...found, rawStatus: "archived" });

  const nextArchived = archivedColumns.map((col) => {
    if (col.id !== "stopped") return col;
    return { ...col, cards: [...col.cards, archivedCard] };
  });

  return { activeColumns: nextActive, archivedColumns: nextArchived };
}

export function moveCampaignCard(
  columns: CampaignBoardColumn[],
  cardId: string,
  targetColumnId: CampaignBoardBucket,
): CampaignBoardColumn[] {
  let movedCard: CampaignBoardCard | undefined;

  const withoutCard = columns.map((col) => {
    const idx = col.cards.findIndex((c) => c.id === cardId);
    if (idx === -1) return col;
    if (col.id === targetColumnId) return col;
    movedCard = col.cards[idx];
    return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
  });

  if (!movedCard) return columns;

  const updatedCard: CampaignBoardCard = {
    ...movedCard,
    rawStatus: targetColumnId,
    badgeTone: targetColumnId === "stopped" ? "stopped" : targetColumnId,
    badgeLabel: targetColumnId,
  };

  return withoutCard.map((col) => {
    if (col.id !== targetColumnId) return col;
    return { ...col, cards: [...col.cards, updatedCard] };
  });
}

export function buildCampaignBoardModel(
  campaigns: CampaignBoardCardInput[],
): CampaignBoardModel {
  const draft: CampaignBoardCard[] = [];
  const active: CampaignBoardCard[] = [];
  const paused: CampaignBoardCard[] = [];
  const completed: CampaignBoardCard[] = [];
  const stopped: CampaignBoardCard[] = [];

  for (const campaign of campaigns) {
    const card = toCard(campaign);
    const bucket = getBucket(campaign.rawStatus);

    if (bucket === "draft") {
      draft.push(card);
    } else if (bucket === "paused") {
      paused.push(card);
    } else if (bucket === "completed") {
      completed.push(card);
    } else if (bucket === "stopped") {
      stopped.push(card);
    } else {
      active.push(card);
    }
  }

  return {
    activeColumns: [
      { id: "draft", title: "Brouillon", hint: "A configurer", cards: draft },
      {
        id: "active",
        title: "En cours",
        hint: "Qualification et envoi",
        accent: true,
        cards: active,
      },
      { id: "paused", title: "En pause", hint: "Suspendues", cards: paused },
    ],
    archivedColumns: [
      {
        id: "completed",
        title: "Terminées",
        hint: "Objectif atteint",
        cards: completed,
      },
      {
        id: "stopped",
        title: "Arrêtées",
        hint: "Stoppées manuellement",
        cards: stopped,
      },
    ],
  };
}
