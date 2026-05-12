# Task v4-020 : `lib/unipile.ts` — client Unipile + retries + signature verify
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — code TypeScript + tests Vitest (TDD).

## Context
Module client Unipile utilisé par WF9 (sourcing), WF10 (outreach), WF11 (Setter LI). Abstrait les appels API REST Unipile avec gestion d'erreurs, retries, et vérification HMAC des webhooks.

**Références** : ARCHI-v4 §Intégrations tierces Unipile · §lib/unipile.ts

## Objective
`lib/unipile.ts` opérationnel avec client typé, retries exponentiels, et verification HMAC.

## Requirements

### Must Have
- [ ] `UnipileClient` class ou fonctions nommées : `sendInvitation`, `sendDM`, `searchProfiles`, `getMessages`, `getAccountStatus`
- [ ] Toutes les requêtes : header `X-API-KEY: UNIPILE_API_KEY`, base URL = `UNIPILE_DSN`
- [ ] Retry 3x avec backoff exponentiel (1s, 2s, 4s) sur erreurs 5xx ou timeout
- [ ] `verifyUnipileWebhook(body: string, signature: string): boolean` — HMAC-SHA256 sur `UNIPILE_WEBHOOK_SECRET`
- [ ] Types : `UnipileProfile`, `UnipileInvitation`, `UnipileDM`, `UnipileAccountStatus`
- [ ] Tests Vitest : `verifyUnipileWebhook` (valid/invalid), mock fetch sur sendInvitation + retry

### Must NOT
- Ne pas exposer `UNIPILE_API_KEY` côté client browser
- Ne pas implémenter le pacing ici — c'est le rôle de lib/pacing.ts

## Technical Approach

```typescript
// lib/unipile.ts
const BASE_URL = process.env.UNIPILE_DSN!
const API_KEY = process.env.UNIPILE_API_KEY!

async function unipileFetch(path: string, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json', ...options?.headers },
      })
      if (res.ok || res.status < 500) return res
      if (i < retries) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    } catch (e) {
      if (i === retries) throw e
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
  throw new Error('Unipile fetch failed after retries')
}

export async function sendInvitation(accountId: string, profileId: string, note?: string) {
  return unipileFetch(`/api/v1/users/${accountId}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ attendee_id: profileId, message: note }),
  })
}

export function verifyUnipileWebhook(body: string, signature: string): boolean {
  const hmac = createHmac('sha256', process.env.UNIPILE_WEBHOOK_SECRET!)
  const expected = hmac.update(body).digest('hex')
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
```

## Acceptance Criteria
- [ ] `npm run test` — tests lib/unipile.ts passent
- [ ] `sendInvitation` avec mock → retourne 200, retry 3x sur 503
- [ ] `verifyUnipileWebhook` retourne false sur mauvaise signature
- [ ] `getAccountStatus` retourne statut du compte LI connecté

## Dependencies
**Blocked By**: v4-019 (UNIPILE_API_KEY + DSN disponibles)

## Complexity & Estimates
Medium · 3h · Risk: Low
