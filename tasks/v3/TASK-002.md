# Task 002: `lib/sheets.ts` + `lib/campaigns.ts` — résolution sheet_id via Index
**Status**: ✅ Complété

## Context
Toute requête v3 nécessite 2 appels Sheets : lire l'Index (campagne → sheet_id) puis lire le GSheet enfant. Centraliser cette logique.

**References**: ARCHI §Frontend structure · PRD §3 F1

## Objective
Les routes API disposent d'utilitaires `getCampaignById(id)` / `listCampaigns()` / `readChildSheet(sheetId, range)` qui masquent la résolution d'ID.

## Requirements
### Must Have
- [ ] Étendre `lib/sheets.ts` avec `readIndex()`, `appendIndex(row)`, `updateIndex(campaignId, patch)`
- [ ] Créer `lib/campaigns.ts` exportant `getCampaignById(id)` → `{ campaign, sheetId, sheetUrl }` (lit Index via `GOOGLE_INDEX_SHEET_ID`)
- [ ] Exporter `listCampaigns()` typé `Campaign[]`
- [ ] Types TS dans `lib/types.ts` : `Campaign`, `Lead`, `ContactRegistryEntry`
- [ ] Helper `readChildSheet(sheetId, range)` réutilise le client Sheets existant

### Must NOT
- [ ] Pas de cache dans cette tâche (TASK-022 s'en occupe)
- [ ] Pas d'I/O dans les types

## Technical Approach
```ts
// lib/campaigns.ts
export async function getCampaignById(id: string): Promise<{ campaign: Campaign; sheetId: string } | null> {
  const rows = await readIndex();
  const match = rows.find(r => r.campaign_id === id);
  if (!match) return null;
  return { campaign: match, sheetId: match.sheet_id };
}
```

## Acceptance Criteria
- [ ] `getCampaignById('inexistant')` → `null` (pas d'exception)
- [ ] Types exhaustifs (pas de `any`)
- [ ] Tests unitaires `lib/campaigns.test.ts` avec mock Sheets

## Verification
`npm test -- campaigns` → vert. Utiliser dans un handler temporaire pour confirmer.

## Dependencies
**Blocked By**: Task 001

## Complexity & Estimates
- **Complexity**: Low-Medium · **Est. Time**: 2h
