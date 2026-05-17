# Task v4-008 : Cron polling Calendly → tab Meetings
**Status**: 🚧 Partiel — 2026-05-17 (code + tests + build OK ; smoke Calendly/Sheets réel restant)

## Autonomie
🤖 **Claude 100%** — route Next.js cron + tests Vitest (TDD).

## Context
Plan Calendly gratuit = pas de webhooks. Approche retenue : **polling toutes les 5 minutes** via Vercel Cron.
La route vérifie les `scheduled_events` récents, détecte les nouveaux meetings, écrit dans tab `Meetings` + passe lead en `booked`.

**Références** : PRD-v4 F3 · ARCHI-v4 §API Routes v4 · v4-001 (décision polling 2026-05-13)

## Objective
Cron `/api/calendly/poll` qui détecte nouveaux meetings Calendly (fenêtre glissante 10min) → tab Meetings + lead.statut=booked.

## Requirements

### Must Have
- [x] `GET /api/calendly/poll` sécurisée par `CRON_SECRET` header (Vercel Cron l'envoie automatiquement)
- [x] Appel `GET /scheduled_events` avec `min_start_time = now-10min`, `max_start_time = now+30days`, `status=active`, `user=$CALENDLY_USER_URI`
- [x] Pour chaque event : récupérer invitees via `GET /scheduled_events/{uuid}/invitees`
- [x] Résout `lead_id` via Index (cherche email invitee dans Leads_Qualified des enfants actifs)
- [x] Écrit row dans tab `Meetings` de l'enfant : `{meeting_id, lead_id, calendly_uri, start_at, event_type, booked_via: 'setter', status: 'booked'}`
- [x] Update `Leads_Qualified` : `statut = booked` (implémenté sur colonne existante `statut_email`, fallback header `statut` si présent)
- [x] Idempotent : si `calendly_uri` déjà en base → no-op
- [x] `vercel.json` ou `vercel.ts` : cron `*/5 * * * *` → `/api/calendly/poll`
- [x] Tests Vitest : nouvel event (écrit Meetings), event déjà connu (no-op), 0 event (pas d'erreur)

### Must NOT
- Ne pas logger email invitee en clair (PII)
- Ne pas exposer la route sans vérification `CRON_SECRET`

## Technical Approach

```typescript
// app/api/calendly/poll/route.ts
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const events = await fetchCalendlyEvents(since)

  for (const event of events) {
    await processBookingIfNew(event) // idempotent
  }

  return Response.json({ processed: events.length })
}
```

```json
// vercel.json
{
  "crons": [{ "path": "/api/calendly/poll", "schedule": "*/5 * * * *" }]
}
```

Variable à ajouter : `CRON_SECRET` (Vercel l'injecte automatiquement sur les projets liés).

## Acceptance Criteria
- [x] `npm run test` — tests polling passent
- [ ] Cron déclenché → row écrite dans Meetings + lead.statut=booked
- [x] Deuxième déclenchement même event → no-op
- [x] Route répond 401 sans `CRON_SECRET`

## Avancement

### 2026-05-17 — Code cron polling livré

- ✅ Ajout `lib/calendly-poll.ts` : fenêtre glissante 10 min, résolution invitee email → lead actif via Index, idempotence `calendly_uri`, écriture `Meetings!A:G`, update statut lead.
- ✅ Extension `lib/calendly.ts` : `fetchCalendlyScheduledEvents()`, `fetchCalendlyEventInvitees()`, extraction UUID event.
- ✅ Ajout route `GET /api/calendly/poll` sécurisée par `Authorization: Bearer $CRON_SECRET`.
- ✅ Ajout `vercel.json` cron `*/5 * * * *`.
- ✅ Tests ajoutés : route 401/OK, nouvel event, event déjà connu, 0 event, récupération invitees.
- ✅ Preuves : `npm run test` → 67 fichiers / 345 tests passés ; `npm run build` → OK.
- ⬜ Reste : smoke réel staging avec Calendly + GSheet enfant pour valider l'écriture live et la valeur de statut attendue côté feuille.

## Dependencies
**Blocked By**: v4-002 (tab Meetings), v4-006 (`lib/calendly.ts`)

## Complexity & Estimates
Medium · 2h · Risk: Low
