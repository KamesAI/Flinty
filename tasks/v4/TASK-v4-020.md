# Task v4-020 : `lib/unipile.ts` — client Unipile + retries + signature verify
**Status**: 🚧 Partiel — 2026-05-20

## Autonomie
🤖 **Claude 100%** — code TypeScript + tests Vitest (TDD).

## Context
Module client Unipile utilisé par WF9 (sourcing), WF10 (outreach), WF11 (Setter LI). Abstrait les appels API REST Unipile avec gestion d'erreurs, retries, et vérification HMAC des webhooks.

**Références** : ARCHI-v4 §Intégrations tierces Unipile · §lib/unipile.ts

## Objective
`lib/unipile.ts` opérationnel avec client typé, retries exponentiels, et verification HMAC.

## Requirements

### Must Have
- [x] `UnipileClient` class ou fonctions nommées : `sendInvitation`, `sendDM`, `searchProfiles`, `getMessages`, `getAccountStatus`
- [x] Toutes les requêtes : header `X-API-KEY: UNIPILE_API_KEY`, base URL = `UNIPILE_DSN`
- [x] Retry 3x avec backoff exponentiel (1s, 2s, 4s) sur erreurs 5xx ou timeout
- [x] `verifyUnipileWebhook(body: string, signature: string): boolean` — HMAC-SHA256 sur `UNIPILE_WEBHOOK_SECRET`
- [x] Types : `UnipileProfile`, `UnipileInvitation`, `UnipileDM`, `UnipileAccountStatus`
- [x] Tests Vitest : `verifyUnipileWebhook` (valid/invalid), mock fetch sur sendInvitation + retry

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
- [x] `npm run test` — tests lib/unipile.ts passent
- [x] `sendInvitation` avec mock → retourne 200, retry 3x sur 503
- [x] `verifyUnipileWebhook` retourne false sur mauvaise signature
- [ ] `getAccountStatus` retourne statut du compte LI connecté

## Avancement

### 2026-05-20 — Client mock-ready, test live en attente Unipile
- `lib/unipile.ts` durci : retries uniquement sur timeouts et 5xx, backoff 1s/2s/4s, 4xx sans retry.
- Support `UNIPILE_DSN` court (`api1`) ou URL complète (`https://.../api/v1`).
- HMAC webhook via `node:crypto` + `timingSafeEqual`, avec wrapper `verifyUnipileWebhook`.
- Types ajoutés : `UnipileInvitation`, `UnipileDM`, alias `UnipileAccountStatus`.
- Tests Vitest couvrent `sendInvitation`, `sendDM`, `searchProfiles`, `getMessages`, `getAccountStatus`, signature valid/invalid, retry 503, timeout, non-retry réseau non-timeout.

**Reste avant ✅** :
- Exécuter un appel live `getAccountStatus` / `/users/me` avec `UNIPILE_API_KEY`, `UNIPILE_DSN` et compte LinkedIn connecté.

## Dependencies
**Blocked By**: v4-019 (UNIPILE_API_KEY + DSN disponibles)

## Complexity & Estimates
Medium · 3h · Risk: Low
