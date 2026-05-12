import { describe, expect, it } from "vitest";
import {
  buildCampaignBoardModel,
  moveCampaignCard,
  moveCampaignToArchived,
} from "./campaign-board-model";
import type { CampaignBoardColumn } from "./campaign-board-model";

describe("buildCampaignBoardModel", () => {
  it("regroupe les campagnes actives dans Brouillon, En cours et En pause", () => {
    const model = buildCampaignBoardModel([
      {
        id: "draft",
        href: "",
        name: "Campagne brouillon",
        segment: "Audit IA · Paris",
        rawStatus: "new",
        qualified: 0,
        contacted: 0,
        replies: 0,
        openRate: 0,
      },
      {
        id: "running",
        href: "",
        name: "Campagne active",
        segment: "Audit IA · Lyon",
        rawStatus: "active",
        qualified: 32,
        contacted: 24,
        replies: 4,
        openRate: 41.2,
      },
      {
        id: "generating",
        href: "",
        name: "Campagne génération",
        segment: "Audit IA · Lille",
        rawStatus: "generating",
        qualified: 18,
        contacted: 0,
        replies: 0,
        openRate: 0,
      },
      {
        id: "paused",
        href: "",
        name: "Campagne en pause",
        segment: "Audit IA · Nantes",
        rawStatus: "paused",
        qualified: 14,
        contacted: 8,
        replies: 1,
        openRate: 22.8,
      },
    ]);

    expect(model.activeColumns.map((column) => column.title)).toEqual([
      "Brouillon",
      "En cours",
      "En pause",
    ]);
    expect(model.activeColumns[0].cards.map((card) => card.id)).toEqual(["draft"]);
    expect(model.activeColumns[1].cards.map((card) => card.id)).toEqual([
      "running",
      "generating",
    ]);
    expect(model.activeColumns[2].cards.map((card) => card.id)).toEqual(["paused"]);
  });

  it("limite les campagnes archivées à Terminées et Arrêtées", () => {
    const model = buildCampaignBoardModel([
      {
        id: "completed",
        href: "",
        name: "Campagne terminée",
        segment: "Audit IA · Paris",
        rawStatus: "completed",
        qualified: 80,
        contacted: 60,
        replies: 12,
        openRate: 47.5,
      },
      {
        id: "archived",
        href: "",
        name: "Campagne arrêtée",
        segment: "Audit IA · Marseille",
        rawStatus: "archived",
        qualified: 25,
        contacted: 10,
        replies: 1,
        openRate: 12.3,
      },
      {
        id: "inactive",
        href: "",
        name: "Campagne inactive",
        segment: "Audit IA · Bordeaux",
        rawStatus: "inactive",
        qualified: 5,
        contacted: 0,
        replies: 0,
        openRate: 0,
      },
    ]);

    expect(model.archivedColumns.map((column) => column.title)).toEqual([
      "Terminées",
      "Arrêtées",
    ]);
    expect(model.archivedColumns[0].cards.map((card) => card.id)).toEqual(["completed"]);
    expect(model.archivedColumns[1].cards.map((card) => card.id)).toEqual([
      "archived",
      "inactive",
    ]);
  });
});

const SAMPLE_COLUMNS: CampaignBoardColumn[] = [
  {
    id: "draft",
    title: "Brouillon",
    hint: "",
    cards: [
      {
        id: "c1",
        href: "/c1",
        name: "Camp 1",
        segment: "A",
        rawStatus: "draft",
        qualified: 0,
        contacted: 0,
        replies: 0,
        openRate: 0,
        badgeTone: "draft",
        badgeLabel: "draft",
      },
    ],
  },
  {
    id: "active",
    title: "En cours",
    hint: "",
    accent: true,
    cards: [],
  },
  {
    id: "paused",
    title: "En pause",
    hint: "",
    cards: [],
  },
];

describe("moveCampaignCard", () => {
  it("déplace une carte d'une colonne vers une autre", () => {
    const result = moveCampaignCard(SAMPLE_COLUMNS, "c1", "active");
    expect(result[0].cards).toHaveLength(0);
    expect(result[1].cards).toHaveLength(1);
    expect(result[1].cards[0].id).toBe("c1");
  });

  it("met à jour badgeTone et rawStatus selon la colonne cible", () => {
    const result = moveCampaignCard(SAMPLE_COLUMNS, "c1", "paused");
    expect(result[2].cards[0].badgeTone).toBe("paused");
    expect(result[2].cards[0].rawStatus).toBe("paused");
  });

  it("retourne les colonnes inchangées si la carte est introuvable", () => {
    const result = moveCampaignCard(SAMPLE_COLUMNS, "unknown", "active");
    expect(result).toEqual(SAMPLE_COLUMNS);
  });

  it("retourne les colonnes inchangées si la carte est déjà dans la colonne cible", () => {
    const result = moveCampaignCard(SAMPLE_COLUMNS, "c1", "draft");
    expect(result[0].cards).toHaveLength(1);
    expect(result[1].cards).toHaveLength(0);
  });
});

describe("moveCampaignToArchived", () => {
  it("déplace une campagne de l’espace actif vers Arrêtées avec rawStatus archivé", () => {
    const model = buildCampaignBoardModel([
      {
        id: "c-draft",
        href: "/x",
        name: "Test",
        segment: "S",
        rawStatus: "new",
        qualified: 0,
        contacted: 0,
        replies: 0,
        openRate: 0,
      },
    ]);
    const r = moveCampaignToArchived(
      model.activeColumns,
      model.archivedColumns,
      "c-draft",
    );
    expect(r).not.toBeNull();
    expect(
      r!.activeColumns.flatMap((col) => col.cards).map((c) => c.id),
    ).toHaveLength(0);
    const stopped = r!.archivedColumns.find((col) => col.id === "stopped");
    expect(stopped?.cards.map((c) => c.id)).toEqual(["c-draft"]);
    expect(stopped?.cards[0].rawStatus).toBe("archived");
    expect(stopped?.cards[0].badgeTone).toBe("stopped");
  });

  it("retourne null si l’id est introuvable", () => {
    const model = buildCampaignBoardModel([]);
    const r = moveCampaignToArchived(
      model.activeColumns,
      model.archivedColumns,
      "nope",
    );
    expect(r).toBeNull();
  });
});
