# Task v4-031 : OAuth Calendly v2 — remplace PAT + multi-event types par workspace
**Status**: ✅ Complété — 2026-05-18

## Autonomie
🤖 **Claude 100%** — routes OAuth Next.js + lib/calendly.ts extension.

## Context
Phase 1 utilise un Personal Access Token Calendly (MVP). Phase 3 migre vers OAuth 2.0 pour supporter plusieurs workspaces avec leur propre compte Calendly (clients agence). Chaque workspace a ses propres event types Calendly.

**Références** : PRD-v4 F11 · ARCHI-v4 §Intégrations tierces Calendly OAuth Phase 3

## Objective
Flow OAuth Calendly v2 complet + stockage tokens par workspace + event types multi-tenant.

## Requirements

### Must Have
- [x] Route `GET /api/calendly/auth/initiate` → redirect vers Calendly OAuth (client_id, redirect_uri, scope=default)
- [x] Route `GET /api/calendly/auth/callback` → échange code → access_token + refresh_token → stocké dans tab Accounts (type=calendly, workspace_id)
- [x] `lib/calendly.ts` : `getCalendlyToken(workspaceId: string): Promise<string>` — lit Accounts tab + refresh si expiré
- [x] `getAvailableSlots` étendu : utilise token par workspace (pas global)
- [x] Route `GET /api/calendly/event-types` — liste les event types du workspace actuel
- [x] UI settings workspace : sélecteur event type par défaut

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
- [x] Clic "Connecter Calendly" → redirect OAuth Calendly
- [x] Après auth → tokens stockés dans Accounts (type=calendly)
- [x] `GET /api/calendly/slots` fonctionne avec token OAuth (pas PAT)
- [x] Token refresh automatique si expiré
- [x] PAT fallback si OAuth non configuré

## Avancement

### 2026-05-18 — OAuth Calendly multi-workspace livré
- Routes OAuth livrées :
  - `GET /api/calendly/auth/initiate` construit l'URL OAuth Calendly et pose un cookie httpOnly `calendly_oauth_workspace`.
  - `GET /api/calendly/auth/callback` échange le code et stocke `access_token`, `refresh_token`, `token_expires_at` dans `Accounts` avec `type=calendly` et `workspace_id`.
- `lib/calendly.ts` :
  - `getCalendlyToken(workspaceId)` lit `Accounts`, retourne le token OAuth valide, refresh automatiquement si expiré, sinon fallback PAT.
  - `getAvailableSlots(eventTypeUri, count, workspaceId)` utilise le token par workspace.
  - `listCalendlyEventTypes(token)` liste les event types actifs Calendly.
- Routes workspace/settings :
  - `GET /api/calendly/event-types` liste les event types du workspace courant.
  - `GET /api/calendly/slots` utilise `x-workspace-id`, fallback sur `Workspaces.default_calendly_event_uri`, puis PAT si OAuth absent.
  - `GET/PUT /api/workspaces/settings` expose le statut Calendly et persiste l'event type par défaut sans exposer les tokens.
- UI livrée : `/dashboard/settings/calendly/connect` avec statut OAuth, bouton connecter Calendly et sélecteur d'event type par défaut.
- Setter : `workspace_id` propagé jusqu'au tool `get_calendly_slots`, donc les créneaux proposés utilisent le token OAuth du workspace.
- Migration : `scripts/migrate-workspaces.ts` met à jour `Workspaces!A:E` avec `default_calendly_event_uri`.

**Preuves** :
- `npm run test` → 84 fichiers / 439 tests ✅.
- `npm run build` → OK ✅.

**Note opérationnelle** :
- Pour un vrai OAuth staging/prod, configurer `CALENDLY_CLIENT_ID`, `CALENDLY_CLIENT_SECRET` et exécuter la migration Workspaces sur le GSheet réel.

## Dependencies
**Blocked By**: v4-008 (webhook Calendly), v4-030 (Workspaces)

## Complexity & Estimates
High · 4h · Risk: Medium (OAuth flow Calendly)
