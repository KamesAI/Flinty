# Task v4-006 : `lib/calendly.ts` + route `/api/calendly/slots` (GET 3 slots)
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — code TypeScript + route Next.js + tests Vitest (TDD).

## Context
Le Setter doit proposer 3 créneaux Calendly réels quand un prospect est `meeting_ready`. Ce module abstrait l'appel API Calendly v2 et formate les slots de façon naturelle pour insertion dans la réponse email.

**Références** : PRD-v4 F3 · ARCHI-v4 §Intégrations tierces Calendly

## Objective
`lib/calendly.ts` avec `getAvailableSlots()` + route `/api/calendly/slots` GET + formatage naturel des slots.

## Requirements

### Must Have
- [ ] `getAvailableSlots(eventTypeUri: string, count?: number): Promise<CalendlySlot[]>` — appel API `GET /event_type_available_times`, retourne N slots
- [ ] `formatSlotsNatural(slots: CalendlySlot[]): string` — ex: `"Mardi 14 mai à 14h, mercredi 15 mai à 10h, ou jeudi 16 mai à 16h ?"` (locale fr-FR)
- [ ] `verifyWebhookSignature(body: string, signature: string, secret: string): boolean` — HMAC-SHA256 pour Calendly webhook
- [ ] Route `GET /api/calendly/slots?event_type_uri=...&count=3` — appelle `getAvailableSlots`, retourne JSON
- [ ] Tests Vitest : `formatSlotsNatural` (fixtures de slots), `verifyWebhookSignature` (valid + invalid)

### Must NOT
- Token Calendly côté serveur uniquement — ne jamais le passer au client
- Ne pas appeler l'API Calendly depuis le client browser
- Pas de `NEXT_PUBLIC_` sur les vars Calendly

## Technical Approach

```typescript
// lib/calendly.ts
const CALENDLY_BASE = 'https://api.calendly.com'

export interface CalendlySlot {
  start_time: string  // ISO 8601
  end_time: string
  status: 'available'
}

export async function getAvailableSlots(
  eventTypeUri: string,
  count = 3
): Promise<CalendlySlot[]> {
  const startTime = new Date().toISOString()
  const endTime = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // +7j
  const res = await fetch(
    `${CALENDLY_BASE}/event_type_available_times?event_type=${encodeURIComponent(eventTypeUri)}&start_time=${startTime}&end_time=${endTime}`,
    { headers: { Authorization: `Bearer ${process.env.CALENDLY_TOKEN}` } }
  )
  const data = await res.json()
  return data.collection.filter((s: any) => s.status === 'available').slice(0, count)
}

export function formatSlotsNatural(slots: CalendlySlot[]): string {
  const parts = slots.map((s, i) => {
    const d = new Date(s.start_time)
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return i === slots.length - 1 ? `ou ${label} à ${time}` : `${label} à ${time}`
  })
  return parts.join(', ') + ' ?'
}
```

Route :
```typescript
// app/api/calendly/slots/route.ts
import { getAvailableSlots } from '@/lib/calendly'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventTypeUri = searchParams.get('event_type_uri')
  const count = Number(searchParams.get('count') ?? '3')
  if (!eventTypeUri) return Response.json({ error: 'event_type_uri required' }, { status: 400 })
  const slots = await getAvailableSlots(eventTypeUri, count)
  return Response.json({ slots })
}
```

## Acceptance Criteria
- [ ] `npm run test` — tests formatSlotsNatural + verifyWebhookSignature passent
- [ ] `GET /api/calendly/slots?event_type_uri=...&count=3` retourne 3 slots (avec vrai token)
- [ ] Slots formatés en français naturel (pas "2026-05-14T14:00:00Z", mais "mardi 14 mai à 14h")
- [ ] `verifyWebhookSignature` retourne false sur signature invalide

## Dependencies
**Blocked By**: v4-001 (CALENDLY_TOKEN doit être configuré)

## Complexity & Estimates
Medium · 2h · Risk: Low
