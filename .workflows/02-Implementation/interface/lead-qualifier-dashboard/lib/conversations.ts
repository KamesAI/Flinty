import { getSheets } from "./sheets";
import type { ConversationTurn, ConversationChannel, ConversationRole, IntentLabel } from "./types";

export { type ConversationTurn };

export type ConversationTurnInput = Omit<ConversationTurn, never>;

export const CONVERSATIONS_SHEET_NAME = "Conversations";

export const CONVERSATIONS_HEADER = [
  "turn_id",
  "lead_id",
  "channel",
  "role",
  "content",
  "sent_at",
  "intent",
  "validated_by",
  "edited_from_draft",
] as const;

export function parseConversationRows(rows: string[][]): ConversationTurn[] {
  if (rows.length <= 1) return [];
  const [, ...data] = rows;
  return data
    .filter((row) => (row[0] ?? "").trim().length > 0)
    .map((row) => ({
      turn_id: row[0] ?? "",
      lead_id: row[1] ?? "",
      channel: ((row[2] ?? "email") as ConversationChannel) || "email",
      role: ((row[3] ?? "prospect") as ConversationRole) || "prospect",
      content: row[4] ?? "",
      sent_at: row[5] ?? "",
      intent: ((row[6] ?? "") as IntentLabel | ""),
      validated_by: row[7] ?? "",
      edited_from_draft: ((row[8] ?? "false") as "true" | "false" | ""),
    }));
}

export function formatConversationTurn(turn: ConversationTurnInput): string[] {
  return [
    turn.turn_id,
    turn.lead_id,
    turn.channel,
    turn.role,
    turn.content,
    turn.sent_at,
    turn.intent,
    turn.validated_by,
    turn.edited_from_draft,
  ];
}

export function findConversationTurn(
  turns: ConversationTurn[],
  turnId: string
): ConversationTurn | undefined {
  return turns.find((turn) => turn.turn_id === turnId);
}

export function listUnvalidatedSetterDrafts(
  turns: ConversationTurn[]
): ConversationTurn[] {
  return turns.filter(
    (turn) =>
      turn.role === "setter" &&
      !turn.validated_by &&
      turn.content.trim().length > 0
  );
}

async function ensureConversationsSheet(sheetId: string): Promise<void> {
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const exists = (meta.data.sheets ?? []).some(
    (s) => s.properties?.title === CONVERSATIONS_SHEET_NAME
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: CONVERSATIONS_SHEET_NAME } } }] },
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${CONVERSATIONS_SHEET_NAME}!A1:I1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[...CONVERSATIONS_HEADER]] },
  });
}

/**
 * Lit tous les turns d'un lead depuis l'onglet Conversations du GSheet enfant.
 * `sheetId` = spreadsheetId du GSheet enfant de la campagne.
 */
export async function getConversationThread(
  sheetId: string,
  leadId: string
): Promise<ConversationTurn[]> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${CONVERSATIONS_SHEET_NAME}!A1:I5000`,
  }).catch(() => ({ data: { values: [] } }));

  const rows = (response.data.values ?? []) as string[][];
  const turns = parseConversationRows(rows);
  return turns.filter((t) => t.lead_id === leadId);
}

export async function getAllConversationTurns(sheetId: string): Promise<ConversationTurn[]> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${CONVERSATIONS_SHEET_NAME}!A1:I5000`,
  }).catch(() => ({ data: { values: [] } }));

  return parseConversationRows((response.data.values ?? []) as string[][]);
}

/**
 * Ajoute un turn dans l'onglet Conversations du GSheet enfant.
 * Crée l'onglet s'il n'existe pas.
 */
export async function appendConversationTurn(
  sheetId: string,
  turn: ConversationTurnInput
): Promise<void> {
  const sheets = await getSheets();

  // Vérif onglet existe (lazy ensure — pas de re-fetch si ça fonctionne)
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${CONVERSATIONS_SHEET_NAME}!A:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [formatConversationTurn(turn)] },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unable to parse range")) {
      await ensureConversationsSheet(sheetId);
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${CONVERSATIONS_SHEET_NAME}!A:I`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [formatConversationTurn(turn)] },
      });
    } else {
      throw e;
    }
  }
}

/**
 * Met à jour validated_by + edited_from_draft d'un turn existant.
 * Recherche par turn_id dans toutes les lignes de l'onglet.
 */
export async function validateConversationTurn(
  sheetId: string,
  turnId: string,
  validatedBy: string,
  editedContent?: string
): Promise<void> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${CONVERSATIONS_SHEET_NAME}!A1:I5000`,
  });

  const rows = (response.data.values ?? []) as string[][];
  const rowIndex = rows.findIndex((row) => row[0] === turnId);
  if (rowIndex === -1) throw new Error(`Turn ${turnId} not found in sheet ${sheetId}`);

  const row = [...rows[rowIndex]];
  if (editedContent !== undefined) {
    row[4] = editedContent;
    row[8] = "true";
  }
  row[7] = validatedBy;

  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${CONVERSATIONS_SHEET_NAME}!A${sheetRow}:I${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

export async function findConversationTurnById(
  sheetId: string,
  turnId: string
): Promise<ConversationTurn | undefined> {
  const turns = await getAllConversationTurns(sheetId);
  return findConversationTurn(turns, turnId);
}

/** Génère un turn_id unique basé sur timestamp + random. */
export function generateTurnId(): string {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
