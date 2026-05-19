# TASK v4-036 — Flinty daily brief export Frank/Hermes

**Status** : ✅ Complété — 2026-05-19

## Objectif

Produire chaque jour une synthèse structurée du pipeline commercial Kames AI, lisible par Frank/Hermes, sans donner accès à la base complète Flinty.

## Requirements

- [x] Export JSON `daily-pipeline.json`.
- [x] Fonction `generateDailyPipelineBriefData()`.
- [x] Endpoint read-only `GET /api/frank/daily-brief-data`.
- [x] Script `npm run export:frank-daily-brief`.
- [x] Chemin de sortie par défaut `/home/kames/KamesOS/data/flinty/daily-pipeline.json`.
- [x] Aucun envoi email ou LinkedIn.
- [x] Aucune mutation commerciale.
- [x] Aucun secret dans le JSON.
- [x] Aucun token, cookie, mot de passe ou credential dans les logs.
- [x] README court avec lancement, chemin, données incluses et exclusions sécurité.

## Acceptance Criteria

- [x] Le JSON expose `date`, `summary`, `priorities`, `followups_due`, `new_replies`, `blocked_or_stale`, `market_signals`, `optional_drafts_to_prepare`.
- [x] Chaque lead expose uniquement `id`, `company`, `contact_name` si disponible, `stage`, `temperature`, `reason`, `last_interaction`, `next_action_due`, `recommended_action`, `channel`, `message_summary` si utile.
- [x] Les emails, téléphones, URLs, tokens, cookies, mots de passe, credentials et URLs Sheets ne sont pas inclus.
- [x] Le script écrit le fichier JSON et ne logue que chemin, date et compteurs agrégés.
- [x] L'endpoint est read-only et retourne le même contrat de données.

## Avancement

### 2026-05-19

- Ajout `lib/frank-daily-brief.ts` : génération du brief depuis Campagnes, Leads_Qualified et Conversations, avec sanitation des champs texte.
- Ajout `scripts/export-frank-daily-brief.mjs` : export read-only Google Sheets vers `/home/kames/KamesOS/data/flinty/daily-pipeline.json`.
- Ajout endpoint `GET /api/frank/daily-brief-data`.
- Ajout doc `docs/frank-daily-brief.md`.
- Ajout tests `lib/frank-daily-brief.test.ts` couvrant structure et non-exposition des secrets.

## Preuves

- `npm run test -- lib/frank-daily-brief.test.ts` → 2/2 tests passés.
- `npm run test` → 85 fichiers, 444 tests passés.
- `npm run build` → OK, endpoint `/api/frank/daily-brief-data` compilé.
- `node --check scripts/export-frank-daily-brief.mjs` → OK.
- Smoke export read-only avec `FRANK_DAILY_BRIEF_OUTPUT_PATH=/private/tmp/flinty-daily-pipeline.json npm run export:frank-daily-brief` → OK, JSON écrit, compteurs agrégés uniquement dans les logs.
- Scan JSON temporaire → top-level attendu, 0 pattern email/URL/token/password/cookie détecté.
