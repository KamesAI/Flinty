import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONVERSATIONS_HEADER,
  CONVERSATIONS_SHEET_NAME,
  addConversationTurnTag,
  parseConversationRows,
  formatConversationTurn,
  findConversationTurn,
  listUnvalidatedSetterDrafts,
  type ConversationTurnInput,
} from "./conversations";

vi.mock("./sheets", () => ({
  getSheets: vi.fn(),
}));

import { getSheets } from "./sheets";

describe("parseConversationRows", () => {
  it("parse les turns avec en-tête et données", () => {
    const rows = [
      [...CONVERSATIONS_HEADER],
      [
        "turn_1",
        "lead_abc",
        "email",
        "prospect",
        "Bonjour, intéressé par votre offre",
        "2026-05-14T09:00:00.000Z",
        "interested",
        "",
        "false",
      ],
      [
        "turn_2",
        "lead_abc",
        "email",
        "setter",
        "Merci pour votre réponse...",
        "2026-05-14T09:01:00.000Z",
        "interested",
        "human",
        "true",
      ],
    ];

    const turns = parseConversationRows(rows);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatchObject({
      turn_id: "turn_1",
      lead_id: "lead_abc",
      channel: "email",
      role: "prospect",
      content: "Bonjour, intéressé par votre offre",
      intent: "interested",
    });
    expect(turns[1].validated_by).toBe("human");
    expect(turns[1].edited_from_draft).toBe("true");
  });

  it("retourne vide si pas de lignes", () => {
    expect(parseConversationRows([])).toHaveLength(0);
  });

  it("ignore les lignes avec turn_id vide", () => {
    const rows = [
      [...CONVERSATIONS_HEADER],
      ["", "lead_abc", "email", "prospect", "test", "2026-05-14T09:00:00.000Z", "", "", ""],
    ];
    expect(parseConversationRows(rows)).toHaveLength(0);
  });

  it("retourne vide si seulement l'en-tête", () => {
    expect(parseConversationRows([[...CONVERSATIONS_HEADER]])).toHaveLength(0);
  });
});

describe("formatConversationTurn", () => {
  it("formate un turn en tableau de strings", () => {
    const input: ConversationTurnInput = {
      turn_id: "turn_x",
      lead_id: "lead_1",
      channel: "email",
      role: "setter",
      content: "Voici ma réponse",
      sent_at: "2026-05-14T10:00:00.000Z",
      intent: "interested",
      validated_by: "",
      edited_from_draft: "false",
    };
    const row = formatConversationTurn(input);
    expect(row).toHaveLength(CONVERSATIONS_HEADER.length);
    expect(row[0]).toBe("turn_x");
    expect(row[1]).toBe("lead_1");
    expect(row[2]).toBe("email");
    expect(row[3]).toBe("setter");
    expect(row[4]).toBe("Voici ma réponse");
    expect(row[8]).toBe("false");
  });
});

describe("draft helpers", () => {
  const turns = parseConversationRows([
    [...CONVERSATIONS_HEADER],
    ["turn_1", "lead_1", "email", "prospect", "Merci", "2026-05-14T09:00:00.000Z", "interested", "", "false"],
    ["turn_2", "lead_1", "email", "setter", "Avec plaisir", "2026-05-14T09:01:00.000Z", "interested", "", "false"],
    ["turn_3", "lead_1", "email", "setter", "Ancienne réponse", "2026-05-14T09:02:00.000Z", "interested", "Thomas", "false"],
    ["turn_4", "lead_2", "email", "setter", "", "2026-05-14T09:03:00.000Z", "hostile", "", "false"],
  ]);

  it("retrouve un turn par turn_id", () => {
    expect(findConversationTurn(turns, "turn_2")?.content).toBe("Avec plaisir");
  });

  it("liste uniquement les drafts Setter non validés et non vides", () => {
    const drafts = listUnvalidatedSetterDrafts(turns);
    expect(drafts.map((turn) => turn.turn_id)).toEqual(["turn_2"]);
  });
});

describe("CONVERSATIONS_SHEET_NAME", () => {
  it("vaut 'Conversations'", () => {
    expect(CONVERSATIONS_SHEET_NAME).toBe("Conversations");
  });
});

describe("addConversationTurnTag", () => {
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSheets).mockResolvedValue({
      spreadsheets: {
        values: {
          get: vi.fn().mockResolvedValue({
            data: {
              values: [
                [...CONVERSATIONS_HEADER],
                [
                  "turn_1",
                  "lead_1",
                  "email",
                  "prospect",
                  "Merci",
                  "2026-05-14T09:00:00.000Z",
                  "interested",
                  "",
                  "false",
                  "existing",
                  "",
                ],
              ],
            },
          }),
          update,
        },
      },
    } as never);
  });

  it("ajoute un tag sans écraser les tags existants", async () => {
    const updated = await addConversationTurnTag("sheet_1", "turn_1", "warmup_positive_reply");

    expect(updated.tags).toBe("existing,warmup_positive_reply");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      spreadsheetId: "sheet_1",
      range: "Conversations!A2:K2",
      requestBody: expect.objectContaining({
        values: [expect.arrayContaining(["existing,warmup_positive_reply"])],
      }),
    }));
  });
});
