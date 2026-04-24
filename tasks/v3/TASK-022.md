# Task 022: Cache LRU sheet_id + tests E2E + déploiement v3
**Status**: ✅ Complété (code + CI — **livraison prod / n8n / smoke réel = Thomas**)

## Context
Dernière ligne droite : optimiser la latence (cache `sheet_id`), tester bout-en-bout, livrer en prod.

**References**: ARCHI §Performance + §Next Steps

## Objective
Cache 5 min opérationnel, suite E2E verte, Flinty v3 déployée sur kamesai.com.

## Requirements
### Must Have
- [x] `lib/cache.ts` : TTL 5 min (`DEFAULT_TTL_MS = 300_000`) pour entrées `campaignById:{id}` → résultat `getCampaignById`
- [x] `getCampaignById` : miss → `readIndex` → `cacheSet` ; hit → pas d’appel Sheets
- [x] Invalidation : `invalidateCampaignSheetIdCache()` après POST `/api/campaigns` réussi (202)
- [x] Playwright E2E smoke **HTTP** (`e2e/flinty-smoke.spec.ts`) : `/` → `/dashboard`, page new campagne, route export ; `vitest.config` **exclut** `e2e/**`
- [x] Vitest : `lib/cache.test.ts`, `lib/campaigns.test.ts` (cache + invalidation), `app/api/.../export/route.test.ts` existant
- [x] Workflow GitHub `.github/workflows/flinty-dashboard-e2e.yml` : `npm ci` → Vitest → Playwright → (build retiré : secrets Google)
- [ ] **Thomas** : preview/prod Vercel + variables (TASK-001) + bascule n8n v3 + smoke 5 leads

### Must NOT
- [x] Pas de suppression des workflows v1 (inchangé dans le repo)

## Technical Approach
Implémenté : `cacheGet` / `cacheSet` / `cacheClear` / `invalidateCampaignSheetIdCache` (store `Map` en mémoire, pas LRU strict — éviction par TTL ; suffisant v3).

## Acceptance Criteria
- [ ] Hit rate cache > 80% après warm-up — **mesure manuelle** (logs / métrique) post-prod
- [x] E2E Playwright vert (smoke HTTP + CI)
- [ ] **Thomas** : Production `kamesai.com/dashboard` + 1 campagne / 5 emails J0

## Dependencies
**Blocked By**: Tasks 005, 017, 020

## Complexity & Estimates
Medium-High · 3h · Risk: Medium (go-live)
