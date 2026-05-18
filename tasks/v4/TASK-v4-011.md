# Task v4-011 : Routes `/api/replies/[lead_id]` GET + `/send` POST + `/escalate` POST
**Status**: ✅ Complété — 2026-05-18

## Autonomie
🤖 **Claude 100%** — routes Next.js + tests Vitest (TDD).

## Context
Ces 3 routes sont l'interface entre l'inbox UI et le backend Setter. GET récupère le thread complet pour affichage. /send déclenche WF8 (envoi validé par Thomas). /escalate retire le draft de la queue et marque escalated.

**Références** : ARCHI-v4 §API Routes v4 · PRD-v4 F4

## Objective
3 routes API fonctionnelles et testées, consommées par l'inbox v4.

## Avancement 2026-05-15
- ✅ Routes créées : `GET /api/replies/[lead_id]`, `POST /api/replies/[lead_id]/send`, `POST /api/replies/[lead_id]/escalate`.
- ✅ Helper `lib/replies.ts` ajouté pour résoudre campagne/lead, lister la queue de drafts, déclencher WF8 et escalader un draft.
- ✅ `GET /api/inbox/summary` ajouté pour exposer les drafts à valider.
- ✅ Tests Vitest ajoutés pour les 3 routes.
- ✅ `/escalate` met à jour `Leads_Qualified.setter_action=escalated`.

## Requirements

### Must Have
**GET `/api/replies/[lead_id]`** :
- [x] Résout `sheet_id` via lead_id (Index Campagnes)
- [x] Appelle `conversations.getThread(sheet_id, lead_id)`
- [x] Retourne thread + lead + campaign pour un draft à valider

**POST `/api/replies/[lead_id]/send`** :
- [x] Body : `{turn_id: string}`
- [x] Déclenche WF8 webhook avec `{lead_id, turn_id, sheet_id, validated_by}`
- [x] Retourne 200 + `{success: true}`

**POST `/api/replies/[lead_id]/escalate`** :
- [x] Body : `{turn_id: string, reason?: string}`
- [x] Update turn dans Conversations : `validated_by = 'escalated:*'`
- [x] Update Leads_Qualified : `setter_action = 'escalated'`
- [x] Retourne 200

- [x] Tests Vitest pour les 3 routes (mock sheets, mock WF8 webhook)

### Must NOT
- Ne pas envoyer l'email directement depuis /send — déléguer à WF8 uniquement
- Ne pas exposer le contenu PII prospect sans auth (ajouter vérification session si auth existe)

## Technical Approach

```typescript
// app/api/replies/[lead_id]/route.ts
export async function GET(request: Request, { params }: { params: { lead_id: string } }) {
  const { lead_id } = params
  const sheetId = await resolveSheetId(lead_id) // via Index
  const [thread, lead] = await Promise.all([
    getThread(sheetId, lead_id),
    getLead(sheetId, lead_id),
  ])
  return Response.json({ thread, lead })
}

// app/api/replies/[lead_id]/send/route.ts
export async function POST(request: Request, { params }: { params: { lead_id: string } }) {
  const { turn_id } = await request.json()
  await fetch(process.env.N8N_WF8_WEBHOOK!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: params.lead_id, turn_id, validated_by: 'human' }),
  })
  return Response.json({ sent: true })
}
```

## Acceptance Criteria
- [x] `npm run test` — tests 3 routes passent
- [x] GET /api/replies/[lead_id] retourne thread + lead + campaign
- [x] POST /send déclenche WF8 (mock webhook capturé dans test)
- [x] POST /escalate update le turn validated_by='escalated'

## Avancement 2026-05-18
- ✅ `escalateSetterDraft()` met à jour le turn Conversations et `Leads_Qualified.setter_action=escalated`.
- ✅ Tests de régression inclus dans `lib/replies-pipeline.test.ts`.
- ✅ Preuves : `npm run test` → 73 fichiers / 382 tests passés ; `npm run build` → OK.

## Dependencies
**Blocked By**: v4-003 (conversations.getThread), v4-010 (WF8 pour /send)

## Complexity & Estimates
Medium · 3h · Risk: Low
