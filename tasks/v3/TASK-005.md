# Task 005: API `/api/campaigns/[id]` — résolution Index→enfant
**Status**: ✅ Complété (2026-04-17)

## Context
La page détail campagne doit résoudre `sheet_id` via l'Index puis lire les leads qualifiés de l'enfant.

**References**: ARCHI §API Routes

## Objective
`GET /api/campaigns/[id]` retourne `{ campaign, leads_qualified, leads_rejected, config }`.

## Requirements
### Must Have
- [x] Handler Next.js App Router `app/api/campaigns/[id]/route.ts`
- [x] Utilise `getCampaignById(id)` → si null, 404
- [x] Lit `Leads_Qualified` + `Leads_Rejected` + `Config` de l'enfant (3 appels Sheets parallèles)
- [x] Normalise les lignes en objets typés `Lead[]`
- [x] Retourne 200 JSON

### Must NOT
- [ ] Pas de mutation dans ce handler

## Technical Approach
```ts
const resolved = await getCampaignById(params.id);
if (!resolved) return new Response('Not Found', { status: 404 });
const [qualified, rejected, config] = await Promise.all([
  readChildSheet(resolved.sheetId, 'Leads_Qualified!A2:U'),
  readChildSheet(resolved.sheetId, 'Leads_Rejected!A2:G'),
  readChildSheet(resolved.sheetId, 'Config!A2:C'),
]);
```

## Acceptance Criteria
- [x] Retourne 404 si campaign_id inconnu
- [x] Retourne 200 avec leads + config sinon
- [x] Latence <1.5s en local (2 round-trips Sheets)

## Dependencies
**Blocked By**: Task 002

## Complexity & Estimates
Low · 1.5h
