# Task v4-030 : Workspaces — tab Index + scope routes multi-tenant
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — migration GSheets + middleware routes Next.js.

## Context
Pour que Kames AI puisse gérer plusieurs clients avec Flinty (chacun avec ses campagnes, compte LI, Calendly), un système de workspaces isole les données par client. Chaque workspace a ses propres campagnes et ses propres comptes Unipile/Calendly.

**Références** : PRD-v4 F11 · ARCHI-v4 §Database Workspaces

## Objective
Tab Workspaces dans Index + scope de toutes les routes API par workspace_id.

## Requirements

### Must Have
- [ ] Tab `Workspaces` dans Index : `workspace_id | name | owner_email | created_at`
- [ ] Workspace par défaut pour Thomas : `workspace_id=kames-default, name=Kames AI, owner_email=thomas@kamesai.com`
- [ ] Champ `workspace_id` ajouté dans Index tab Campagnes (scope campagnes par workspace)
- [ ] Champ `workspace_id` dans tab Accounts (scope comptes Unipile/Calendly par workspace)
- [ ] Middleware `/dashboard/*` : injecte `workspace_id` depuis session/cookie dans toutes les requêtes API
- [ ] Toutes les routes API : filtrent par `workspace_id` dans les queries GSheets
- [ ] Route `GET /api/workspaces` : liste les workspaces du user connecté
- [ ] Tests d'isolation : 2 workspaces créés → les campagnes de l'un ne sont pas visibles dans l'autre

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
- [ ] Tab Workspaces dans Index avec workspace kames-default
- [ ] Routes API filtrées : campagne workspace A non visible depuis workspace B
- [ ] Test isolation : `GET /api/campaigns` avec x-workspace-id=kames-default retourne uniquement les campagnes Thomas
- [ ] Dashboard fonctionne normalement pour Thomas (workspace par défaut transparent)

## Dependencies
**Blocked By**: v4-021 (Accounts tab), v4-002 (schéma GSheets stable)

## Complexity & Estimates
High · 6h · Risk: High (refactoring toutes les routes)
