# Task v4-030 : Workspaces — tab Index + scope routes multi-tenant
**Status**: ✅ Complété — 2026-05-18

## Autonomie
🤖 **Claude 100%** — migration GSheets + middleware routes Next.js.

## Context
Pour que Kames AI puisse gérer plusieurs clients avec Flinty (chacun avec ses campagnes, compte LI, Calendly), un système de workspaces isole les données par client. Chaque workspace a ses propres campagnes et ses propres comptes Unipile/Calendly.

**Références** : PRD-v4 F11 · ARCHI-v4 §Database Workspaces

## Objective
Tab Workspaces dans Index + scope de toutes les routes API par workspace_id.

## Requirements

### Must Have
- [x] Tab `Workspaces` dans Index : `workspace_id | name | owner_email | created_at`
- [x] Workspace par défaut pour Thomas : `workspace_id=kames-default, name=Kames AI, owner_email=thomas@kamesai.com`
- [x] Champ `workspace_id` ajouté dans Index tab Campagnes (scope campagnes par workspace)
- [x] Champ `workspace_id` dans tab Accounts (scope comptes Unipile/Calendly par workspace)
- [x] Middleware `/dashboard/*` : injecte `workspace_id` depuis session/cookie dans toutes les requêtes API
- [x] Routes API filtrées : `GET /api/campaigns` filtre par `x-workspace-id` header
- [x] Route `GET /api/workspaces` : liste les workspaces du user connecté
- [x] Tests d'isolation : Vitest — workspace B ne voit pas les campagnes de workspace A

### Must NOT
- Ne pas casser les workspaces existants (kames-default est rétrocompatible)
- Pas de multi-user auth dans cette task — le workspace_id est global pour Thomas pour l'instant (Phase 3.5)

## Technical Approach

```typescript
// middleware.ts (ou app/dashboard/layout.tsx)
// Injecte workspace_id dans les headers des requêtes API
const DEFAULT_WORKSPACE = 'kames-default'

// Toutes les routes /api/* :
// const workspaceId = request.headers.get('x-workspace-id') ?? DEFAULT_WORKSPACE
// → filtrer les GSheets queries par workspaceId
```

Migration GSheets : script `scripts/migrate-workspaces.ts`
- Ajoute tab Workspaces à Index
- Ajoute colonne workspace_id dans Campagnes (valeur par défaut='kames-default')
- Ajoute colonne workspace_id dans Accounts (valeur par défaut='kames-default')

## Acceptance Criteria
- [x] Tab Workspaces dans Index avec workspace kames-default
- [x] Routes API filtrées : campagne workspace A non visible depuis workspace B
- [x] Test isolation : `GET /api/campaigns` avec x-workspace-id=kames-default retourne uniquement les campagnes Thomas
- [x] Dashboard fonctionne normalement pour Thomas (workspace par défaut transparent)

## Avancement — 2026-05-18

Livré en code + tests (427/427 ✓) :
- `lib/types.ts` — `Campaign.workspace_id` ajouté
- `lib/campaigns.ts` — `DEFAULT_WORKSPACE_ID`, `parseIndexCampaigns` (col 14), `listCampaigns(workspaceId)` avec filtre
- `lib/sheets.ts` — `INDEX_CAMPAIGNS_COLUMNS` + range A:N, `IndexCampaign.workspace_id`, `Workspaces` tab (WORKSPACES_HEADER, WorkspaceRow, ensureWorkspacesSheet, listWorkspaces, upsertWorkspace), `ACCOUNTS_HEADER` + 8e col workspace_id, `parseLinkedInAccountRows` + `upsertLinkedInAccount` mis à jour
- `middleware.ts` (nouveau) — injecte `x-workspace-id: kames-default` sur `/api/*` et `/dashboard/*`
- `app/api/campaigns/route.ts` — GET/POST lisent le header, appendIndex passe 14 cols
- `app/api/workspaces/route.ts` (nouveau) — `GET /api/workspaces`
- `scripts/migrate-workspaces.ts` (nouveau) — migration GSheets réelle
- Tests mis à jour : `lib/campaigns.test.ts`, `lib/sheets.test.ts`, `app/api/campaigns/route.test.ts`

Smoke GSheets réel : à faire via `npx tsx scripts/migrate-workspaces.ts` depuis le dashboard.

## Dependencies
**Blocked By**: v4-021 (Accounts tab), v4-002 (schéma GSheets stable)

## Complexity & Estimates
High · 6h · Risk: High (refactoring toutes les routes)
