# Task v4-024b : WF12 NEW — Health monitor LI : polling Unipile + détecte signaux pré-ban → auto-pause + alerte
**Status**: 🚧 Partiel — 2026-07-04

## Autonomie
🤖 **Claude 100%** — via MCP n8n + route API.

## Context
Le circuit breaker LinkedIn. WF12 tourne toutes les 10 minutes et détecte les signaux pré-ban LinkedIn (captcha, warning email, acceptance_rate <20%, bouton "Suivre" remplaçant "Se connecter"). En cas de signal → pause automatique + alerte Thomas. Tab `LI_Health` dans Index.

**Références** : PRD-v4 F14 · ARCHI-v4 §n8n WF12

## Objective
WF12 opérationnel en staging : polling Unipile + mise à jour LI_Health + auto-pause sur seuils dépassés.

## Requirements

### Must Have
- [ ] Trigger cron n8n : toutes les 10 minutes (node créé mais désactivé jusqu'au branchement live pour éviter les erreurs `Respond to Webhook` hors contexte webhook)
- [ ] Node Unipile : `GET /api/v1/users/{account_id}` → statut compte (captcha ?, suspended ?)
- [ ] Node Unipile : `GET /api/v1/users/{account_id}/invitations` → calcule `accept_rate_7d` sur 7j glissants
- [x] Logique pause :
  - Captcha détecté → `status=paused_captcha`, pause 24h
  - Email LI "activité inhabituelle" → `status=paused_warning`, pause 14j
  - `accept_rate_7d < 20%` sur ≥10 invitations → `status=paused_low_accept`
  - Bouton "Suivre" sur ≥3 profils → `status=paused_follow_mode`, pause 7j
- [x] Node/API : update tab LI_Health Index avec tous les champs via `POST /api/li-health`
- [ ] Node : si transition vers paused → envoie email Thomas (Resend) avec reason + ETA reprise
- [ ] Node : update Campagnes Index — si LI_account_id paused → suspend campagnes LI actives
- [x] Route `GET /api/li-health?account_id=...` — lit LI_Health → retourne statut pour UI
- [x] Route `POST /api/li-health` — upsert `LI_Health` + append `LI_Health_History` pour WF12

### Must NOT
- Ne pas envoyer l'alerte email à chaque run cron — uniquement au changement de status
- Ne pas relancer des invitations si status != active

## Technical Approach

Nodes WF12 :
1. `Schedule Trigger` (toutes les 10 min)
2. `Google Sheets` — read tab Accounts (tous les account_id LI actifs)
3. `Loop` sur chaque account
4. `HTTP Request` Unipile → statut + invitations 7j
5. `Code` — calcul accept_rate_7d + détection signaux
6. `IF` status changé → `HTTP Request` Resend alerte + update LI_Health
7. `Google Sheets` update LI_Health

Statuts possibles : `active | paused_captcha | paused_warning | paused_low_accept | paused_follow_mode | banned`

## Acceptance Criteria
- [ ] WF12 s'exécute sans erreur sur staging (compte Thomas connecté)
- [ ] Tab LI_Health mis à jour à chaque run (last_health_check_at)
- [ ] Simulation accept_rate=15% → status passe à paused_low_accept + email Thomas
- [x] WF10 (outreach) vérifie status dry-run avant chaque action et s'arrête si paused

## Avancement

### 2026-05-20 — Circuit breaker local prêt, WF12 live en attente
- Ajout `lib/li-health.ts` avec évaluation pure des statuts `paused_captcha`, `paused_warning`, `paused_low_accept`, `paused_follow_mode`.
- Tests Vitest : captcha simulé, accept_rate 15%, warning 20–35%, mode Suivre, accept rate sans division par zéro.
- Smoke Phase 2 inclut un payload `paused_captcha` pour WF12 dès que le webhook existe.
- La route `/api/li-health` et le bandeau dashboard existaient déjà ; la page santé lit maintenant l'historique préparé.

**Reste avant ✅** :
- Voir mise à jour 2026-07-04 : WF12 dry-run est créé ; le reste porte sur le polling Unipile/persistance/alertes live.

### 2026-07-04 — WF12 staging dry-run + API persistance prêtes
- Créé et activé n8n `[FLINTY] WF12 - LI Health Monitor (staging dry-run ready)` (`161OqYZPQgClGKAr`), webhook `/webhook/flinty-wf12-li-health`; cron 10 min présent mais désactivé jusqu'au live.
- Ajout `POST /api/li-health` protégé par `CRON_SECRET` si configuré : upsert `LI_Health`, append `LI_Health_History`, champs compteurs `invites_sent_today`, `invites_sent_week`, `organic_action`.
- Smoke MCP n8n dry-run `paused_captcha` : `health_payload.status=paused_captcha`, `should_alert=true`, sans persistance car `dry_run=true`.
- WF10 dry-run stoppé avec `health_status=paused_captcha` : `planned_actions=[]`.

**Reste avant ✅** :
- Remplacer le payload simulé par polling Unipile réel compte + invitations.
- Réactiver le cron après séparation du chemin schedule/webhook ou suppression du `Respond to Webhook` sur chemin cron.
- Smoke persistant `dry_run=false` avec `app_base_url` + `CRON_SECRET` pour écrire réellement `LI_Health`.
- Alerte Resend réelle uniquement sur transition vers `paused_*`.
- Pause des campagnes LI actives dans l'Index.

## Dependencies
**Blocked By**: v4-024 (pacing LI), v4-021 (account_id connecté)

## Complexity & Estimates
High · 4h · Risk: High (signaux pré-ban subtils à détecter)
