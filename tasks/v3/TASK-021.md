# Task 021: Rate limiting + validation Zod
**Status**: ✅ Complété

## Context
Avant ouverture prod v3, protéger les routes sensibles : `generate-icp` (burn tokens Anthropic) et POST `/api/campaigns` (lancements intempestifs coûteux).

**References**: PRD §7 · ARCHI §Security

## Objective
Requêtes abusives rejetées en 429 ; payloads invalides rejetés en 400 avec message clair.

## Requirements
### Must Have
- [x] `zod` installé · rate limit **in-memory** (`Map`) — pas `@upstash/ratelimit` (migration possible plus tard)
- [x] Schéma Zod POST `/api/campaigns` : `nom`, `secteur`, `localisation`, `offre_kames` requis ; `icp_md` non vide (trim) ; `score_minimum` entier 0–100
- [x] Schéma Zod POST `/api/campaigns/generate-icp` : `answers: string[]` longueur 8
- [x] Rate limit : **5 req/min/IP** sur `generate-icp`, **10 req/heure/IP** sur POST `/api/campaigns`
- [x] Helper `withValidation(req, schema)` dans `lib/with-validation.ts`

### Must NOT
- [x] Pas de blocage sur GET (lecture libre)

## Technical Approach
In-memory Map (Node) v3 — instance Vercel Fluid Compute.

## Acceptance Criteria
- [x] Payload sans `icp_md` valide → 400 avec `issues` Zod (flatten)
- [x] 6e appel en <1 min à `generate-icp` → 429 + `Retry-After`
- [x] Réponse 429 contient header `Retry-After` (secondes)

## Dependencies
**Blocked By**: Tasks 004, 011

## Complexity & Estimates
Medium · 2h
