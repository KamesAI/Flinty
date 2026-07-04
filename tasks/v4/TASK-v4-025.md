# Task v4-025 : WF10 LI Outreach — invitation perso IA + cold DM post-acceptance + pacing + checkHealth()
**Status**: 🚧 Partiel — 2026-07-04

## Autonomie
🤖 **Claude 100%** — via MCP n8n.

## Context
WF10 est le moteur outreach LinkedIn. Il tourne toutes les heures, boucle sur les leads `statut_li=new` de la campagne, vérifie le pacing + health, et envoie des invitations personnalisées. Sur `invitation.accepted`, envoie un cold DM généré par IA (réutilise `personalized_hook` v3).

**Références** : PRD-v4 F8 · ARCHI-v4 §n8n WF10

## Objective
WF10 opérationnel en staging : boucle leads → vérif pacing → invitation Unipile → DM post-acceptation.

## Requirements

### Must Have
- [ ] Trigger Schedule horaire (node créé mais désactivé jusqu'au branchement live pour éviter les erreurs `Respond to Webhook` hors contexte webhook)
- [ ] Node Sheets : lit Leads_Qualified de l'enfant actif où `statut_li=new` (cap 20 max par run selon CAPS_LI_DAILY_WARM)
- [x] Node : appel `GET /api/li-health` → si `allowed=false` → STOP (simulé par `health_status` dry-run)
- [x] Node : appel `GET /api/pacing/li-status` → vérif cap daily + weekly avant chaque invitation (`/api/pacing/li-status` livré et testé ; WF10 dry-run consomme les compteurs)
- [ ] Node : génère note invitation via Claude Sonnet (≤300 chars) depuis `personalized_hook` v3 du lead
- [ ] Node Unipile : `POST /api/v1/users/{account_id}/invitations` avec ou sans note (ratio 60/40)
- [ ] Node Gauss delay entre chaque invitation (µ=360s)
- [x] Node/API : update Leads_Qualified `statut_li=invited` (route `POST /api/linkedin/outreach-event` testée ; smoke Sheets réel restant)
- [x] Trigger Webhook Unipile `invitation.accepted` → Node DM : génère cold DM via Claude → send via Unipile DM → update `statut_li=accepted` puis `dm_sent` (plan dry-run DM ; envoi/update live restent à faire)

### Must NOT
- Ne pas dépasser le cap weekly 100 — vérif AVANT chaque invitation (pas après)
- Ne pas envoyer DM immédiatement — délai 0h→24h aléatoire post-acceptance (Gauss µ=4h)

## Technical Approach

WF10 nodes (batch horaire) :
1. `Schedule Trigger` (toutes les heures)
2. `HTTP Request` GET /api/li-health → circuit breaker
3. `HTTP Request` GET /api/pacing/li-status → remaining today + this week
4. `Google Sheets` read Leads_Qualified (statut_li=new, limite cap)
5. `Loop` sur leads :
   a. Génère note invitation (Code node, Claude via OpenRouter)
   b. `shouldAddNote` code node → with/without note
   c. `HTTP Request` Unipile sendInvitation
   d. `Wait` Gauss delay
   e. `Google Sheets` update statut_li=invited
6. `Webhook` trigger sur invitation.accepted → DM flow

Route `GET /api/pacing/li-status` : lit tab LI_Health (invits_sent_today, invits_sent_week) → retourne remaining.

## Acceptance Criteria
- [ ] WF10 run sur staging → 0 erreur n8n, invitations envoyées en respectant caps
- [x] Cap weekly 100 : si invits_sent_week=97 → 3 invitations max par run puis STOP (dry-run)
- [ ] lead.statut_li=invited après invitation réussie
- [ ] Webhook acceptance → DM envoyé (délai Gauss respecté)
- [x] Circuit breaker : si LI_Health.status=paused → WF10 STOP sans invitation (dry-run)

## Avancement

### 2026-07-04 — WF10 staging dry-run actif + route pacing
- Ajout route `GET /api/pacing/li-status?account_id=...` : retourne `allowed`, `reason`, `remaining_today`, `remaining_week`, caps LI, bloque si `LI_Health.status != active`.
- Créé et activé n8n `[FLINTY] WF10 - LI Outreach (staging dry-run ready)` (`32k4hm48Lp4hhubi`), webhook `/webhook/flinty-wf10-li-outreach`; cron horaire présent mais désactivé jusqu'au live.
- Smoke MCP n8n pause : `health_status=paused_captcha` → `stopped=true`, `planned_actions=[]`.
- Smoke MCP n8n cap weekly : `invites_sent_week=97` + 4 leads → 3 invitations planifiées et STOP avant 100.
- Webhook `invitation.accepted` planifie un DM en `draft_inbox`/`dry_run_dm` selon validation/credentials.

### 2026-07-04 — WF10 persist-ready API
- Ajout route interne `POST /api/linkedin/outreach-event` : auth `CRON_SECRET`, résolution `sheet_id` via Index si besoin, update `statut_li` dans le GSheet enfant via `updateLeadFieldInChild`.
- WF10 staging renommé `[FLINTY] WF10 - LI Outreach (staging persist-ready)` et branche `dry_run=false` vers cette route pour marquer le lead planifié `invited` ou l'acceptance en `dm_sent`.
- Tests route : update `statut_li=invited` avec `sheet_id` explicite et rejet `401` si secret invalide.

**Reste avant ✅** :
- Brancher la lecture réelle `Leads_Qualified` dans WF10 schedule.
- Exécuter le smoke persistant pour prouver l'update `statut_li` réelle dans le GSheet enfant.
- Réactiver le schedule après séparation du chemin schedule/webhook ou suppression du `Respond to Webhook` sur chemin schedule.
- Appeler réellement `/api/li-health` puis `/api/pacing/li-status` dans WF10 live avant chaque action.
- Générer la note via IA et appeler Unipile invitations/DM avec compte connecté.
- Smoke staging réel : invitation envoyée, acceptance, DM, update Sheets.

## Dependencies
**Blocked By**: v4-024 (pacing LI), v4-024b (checkHealth), v4-022 (leads LI sourcés)

## Complexity & Estimates
High · 5h · Risk: High (critique anti-ban — tester d'abord avec 1 lead)
