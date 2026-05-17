# Task v4-003 : `lib/conversations.ts` — read/append turn cross-canal
**Status**: ✅ Done — 2026-05-14

## Autonomie
🤖 **Claude 100%** — code TypeScript + tests Vitest (TDD).

## Context
Le Setter doit persister chaque tour de conversation (prospect reply, setter draft, human edit) dans le tab `Conversations` du GSheet enfant. Ce module abstrait la lecture/écriture Sheets pour que `lib/setter.ts` n'ait pas à connaître la mécanique GSheets.

**Références** : ARCHI-v4 §Database v4 tab Conversations · §API Routes v4

## Objective
Module `lib/conversations.ts` avec helpers typés pour lire le thread complet d'un lead et appender un nouveau tour, cross-canal (email ou linkedin).

## Requirements

### Must Have
- [x] Type `Turn` : `{ turn_id: string, lead_id: string, channel: 'email'|'linkedin', role: 'prospect'|'setter'|'human', content: string, sent_at: string, intent?: string, validated_by?: string, edited_from_draft?: boolean }`
- [x] `getThread(sheetId: string, leadId: string): Promise<Turn[]>` — lit tab Conversations, filtre par lead_id, retourne turns ordonnés par sent_at
- [x] `appendTurn(sheetId: string, turn: Omit<Turn, 'turn_id'>): Promise<Turn>` — génère turn_id (uuid), append row dans Conversations, retourne Turn complet
- [x] `updateTurn(sheetId: string, turnId: string, updates: Partial<Turn>): Promise<void>` — met à jour validated_by ou edited_from_draft sur un turn existant
- [x] Tests Vitest : getThread (mock sheets, filter par lead_id), appendTurn (vérifie row ajoutée), updateTurn (vérifie col modifiée)

### Must NOT
- Ne pas exposer la logique GSheets ailleurs — ce module est l'unique point d'accès à tab Conversations
- Ne pas utiliser d'index numérique fragile pour les colonnes — mapper par header name

## Technical Approach

```typescript
// lib/conversations.ts
import { getSheetData, appendRow, updateRow } from './sheets' // helpers existants v3

const CONVERSATIONS_HEADERS = [
  'turn_id', 'lead_id', 'channel', 'role', 'content',
  'sent_at', 'intent', 'validated_by', 'edited_from_draft'
] as const

export async function getThread(sheetId: string, leadId: string): Promise<Turn[]> {
  const rows = await getSheetData(sheetId, 'Conversations!A:I')
  return rows
    .filter(row => row.lead_id === leadId)
    .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
}

export async function appendTurn(
  sheetId: string,
  turn: Omit<Turn, 'turn_id'>
): Promise<Turn> {
  const turn_id = crypto.randomUUID()
  const newTurn = { turn_id, ...turn }
  await appendRow(sheetId, 'Conversations', Object.values(newTurn))
  return newTurn
}
```

## Acceptance Criteria
- [x] `npm run test` — tous les tests conversations.ts passent
- [x] `getThread` retourne uniquement les turns du lead_id demandé, ordonnés chronologiquement
- [x] `appendTurn` génère un turn_id unique et append la row correctement
- [x] `updateTurn` modifie uniquement les colonnes spécifiées sans écraser le reste

## Dependencies
**Blocked By**: v4-002 (tab Conversations doit exister dans le schéma)

## Complexity & Estimates
Medium · 2h · Risk: Low
