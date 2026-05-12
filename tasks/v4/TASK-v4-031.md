# Task v4-031 : OAuth Calendly v2 — remplace PAT + multi-event types par workspace
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — routes OAuth Next.js + lib/calendly.ts extension.

## Context
Phase 1 utilise un Personal Access Token Calendly (MVP). Phase 3 migre vers OAuth 2.0 pour supporter plusieurs workspaces avec leur propre compte Calendly (clients agence). Chaque workspace a ses propres event types Calendly.

**Références** : PRD-v4 F11 · ARCHI-v4 §Intégrations tierces Calendly OAuth Phase 3

## Objective
Flow OAuth Calendly v2 complet + stockage tokens par workspace + event types multi-tenant.

## Requirements

### Must Have
- [ ] Route `GET /api/calendly/auth/initiate` → redirect vers Calendly OAuth (client_id, redirect_uri, scope=default)
- [ ] Route `GET /api/calendly/auth/callback` → échange code → access_token + refresh_token → stocké dans tab Accounts (type=calendly, workspace_id)
- [ ] `lib/calendly.ts` : `getCalendlyToken(workspaceId: string): Promise<string>` — lit Accounts tab + refresh si expiré
- [ ] `getAvailableSlots` étendu : utilise token par workspace (pas global)
- [ ] Route `GET /api/calendly/event-types` — liste les event types du workspace actuel
- [ ] UI settings workspace : sélecteur event type par défaut

### Must NOT
- Ne pas casser le PAT fallback si OAuth non configuré pour un workspace
- Ne pas exposer access_token ou refresh_token côté client

## Technical Approach

Calendly OAuth endpoints :
- Auth URL : `https://auth.calendly.com/oauth/authorize?client_id=...&response_type=code&redirect_uri=...`
- Token URL : `https://auth.calendly.com/oauth/token`

```typescript
// lib/calendly.ts extension
export async function getCalendlyToken(workspaceId: string): Promise<string> {
  // 1. Lire Accounts tab (type=calendly, workspace_id=workspaceId)
  // 2. Si access_token non expiré → return
  // 3. Sinon refresh via POST /oauth/token (refresh_token)
  // 4. Update Accounts tab avec nouveaux tokens
  // 5. Return new access_token
}
```

## Acceptance Criteria
- [ ] Clic "Connecter Calendly" → redirect OAuth Calendly
- [ ] Après auth → tokens stockés dans Accounts (type=calendly)
- [ ] `GET /api/calendly/slots` fonctionne avec token OAuth (pas PAT)
- [ ] Token refresh automatique si expiré
- [ ] PAT fallback si OAuth non configuré

## Dependencies
**Blocked By**: v4-008 (webhook Calendly), v4-030 (Workspaces)

## Complexity & Estimates
High · 4h · Risk: Medium (OAuth flow Calendly)
