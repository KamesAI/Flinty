# Task v4-011 : Routes `/api/replies/[lead_id]` GET + `/send` POST + `/escalate` POST
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — routes Next.js + tests Vitest (TDD).

## Context
Ces 3 routes sont l'interface entre l'inbox UI et le backend Setter. GET récupère le thread complet pour affichage. /send déclenche WF8 (envoi validé par Thomas). /escalate retire le draft de la queue et marque escalated.

**Références** : ARCHI-v4 §API Routes v4 · PRD-v4 F4

## Objective
3 routes API fonctionnelles et testées, consommées par l'inbox v4.

## Requirements

### Must Have
**GET `/api/replies/[lead_id]`** :
- [ ] Résout `sheet_id` via lead_id (Index Campagnes)
- [ ] Appelle `conversations.getThread(sheet_id, lead_id)`
- [ ] Retourne `{thread: Turn[], lead: {email, name, statut}, campaign: {name, setter_validation}}`

**POST `/api/replies/[lead_id]/send`** :
- [ ] Body : `{turn_id: string}`
- [ ] Déclenche WF8 webhook avec `{lead_id, turn_id, sheet_id, validated_by: 'human'}`
- [ ] Retourne 200 + `{sent: true}`

**POST `/api/replies/[lead_id]/escalate`** :
- [ ] Body : `{turn_id: string, reason?: string}`
- [ ] Update turn dans Conversations : `validated_by = 'escalated'`
- [ ] Update Leads_Qualified : `setter_action = 'escalated'`
- [ ] Retourne 200

- [ ] Tests Vitest pour les 3 routes (mock sheets, mock WF8 webhook)

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
- [ ] `npm run test` — tests 3 routes passent
- [ ] GET /api/replies/[lead_id] retourne thread + lead + campaign
- [ ] POST /send déclenche WF8 (mock webhook capturé dans test)
- [ ] POST /escalate update le turn validated_by='escalated'

## Dependencies
**Blocked By**: v4-003 (conversations.getThread), v4-010 (WF8 pour /send)

## Complexity & Estimates
Medium · 3h · Risk: Low
