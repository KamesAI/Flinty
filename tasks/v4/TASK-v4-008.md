# Task v4-008 : Route `/api/calendly/webhook` — invitee.created → tab Meetings
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — route Next.js + tests Vitest (TDD).

## Context
Quand un prospect cliqueun créneau Calendly et confirme la réunion, Calendly envoie un webhook `invitee.created`. Ce webhook doit écrire dans le tab `Meetings` du GSheet enfant et passer le lead en statut `booked`.

**Références** : PRD-v4 F3 · ARCHI-v4 §API Routes v4

## Objective
Route `/api/calendly/webhook` POST qui reçoit, valide et traite `invitee.created` → tab Meetings + lead.statut=booked.

## Requirements

### Must Have
- [ ] `POST /api/calendly/webhook` — vérifie signature HMAC-SHA256 Calendly (`calendly-webhook-signature` header)
- [ ] Parse event : `event_type`, `payload.invitee.email`, `payload.event.start_time`, `payload.event.uri`
- [ ] Résout `lead_id` via Index (cherche email dans Leads_Qualified des enfants actifs)
- [ ] Écrit row dans tab `Meetings` de l'enfant : `{meeting_id: uuid, lead_id, calendly_uri, start_at, event_type, booked_via: 'setter', status: 'booked'}`
- [ ] Update `Leads_Qualified` : `statut = booked`
- [ ] Retourne 200 OK immédiatement (Calendly attend réponse < 5s)
- [ ] Idempotent : si `calendly_uri` déjà en base → no-op (évite double-write si retry)
- [ ] Tests Vitest : payload valide (vérifie écriture Meetings), signature invalide (403), duplicate (no-op)

### Must NOT
- Ne pas faire de lourds appels GSheets synchrones avant de répondre 200 — écrire en background si nécessaire
- Ne pas logger le contenu du payload invitee en clair (PII)

## Technical Approach

```typescript
// app/api/calendly/webhook/route.ts
import { verifyWebhookSignature } from '@/lib/calendly'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('calendly-webhook-signature') ?? ''

  if (!verifyWebhookSignature(body, sig, process.env.CALENDLY_WEBHOOK_SECRET!)) {
    return new Response('Unauthorized', { status: 403 })
  }

  const event = JSON.parse(body)
  if (event.event !== 'invitee.created') return new Response('OK') // ignore autres events

  // Process async
  void processCalendlyBooking(event.payload)
  return new Response('OK')
}
```

## Acceptance Criteria
- [ ] `npm run test` — tests route webhook passent
- [ ] Signature invalide → 403 immédiat
- [ ] Payload `invitee.created` → row écrite dans Meetings + lead.statut=booked
- [ ] Deuxième envoi même `calendly_uri` → no-op (idempotent)
- [ ] Route répond 200 en <500ms

## Dependencies
**Blocked By**: v4-002 (tab Meetings doit exister), v4-006 (verifyWebhookSignature)

## Complexity & Estimates
Medium · 2h · Risk: Low
